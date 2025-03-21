import json
import os
import re
from typing import List, Dict, Optional

from langchain_community.tools import TavilySearchResults
from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.constants import END, START
from langgraph.graph import StateGraph
from pydantic import BaseModel, Field



class AgentState(BaseModel):
    messages: List[Dict[str, str]] = []
    current_input: str = ""
    thought: str = ""
    selected_tool: Optional[str] = None
    tool_input: str = ""
    tool_output: str = ""
    final_answer: str = ""
    status: str = "STARTING"


os.environ["TAVILY_API_KEY"] = "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"
search_tool = TavilySearchResults(max_results=2, time_range="day", )  # 时间不准确-有1个月的延迟


# 定义可用工具
def calculator_tool(a: int, b: int):
    return a * b


# Define a wrapper function for TavilySearchResults
def search_tool_wrapper(params: dict):
    query = params.get('query', '')
    return search_tool.ainvoke({'query': query})


tools = [
    Tool(
        name="search_tool",
        description="用于执行上网搜索",
        func=search_tool_wrapper
    ),
    Tool(
        name="calculator_tool",
        description="用于执行两个数相乘",
        func=calculator_tool
    )

]


async def chatbot(state: AgentState) -> AgentState:
    """思考下一步行动"""
    prompt = f"""
    基于用户输入和当前对话历史，思考下一步行动。
    用户输入: {state.current_input}
    可用工具: {[t.name + ': ' + t.description for t in tools]}

    请决定:
    1. 是否需要使用工具
    2. 如果需要，选择哪个工具
    3. 使用什么参数调用工具
    不需要打印出思考过程，我只需要最终结果
    对思考的结果以json格式进行返回，请严格按照此提示执行，每段不需要空行    
    举一些正确的例子：
    {{"thought": "用户似乎在询问我是谁，可能是在确认身份或者想要了解关于我的信息。由于这是一个对话的开始，我需要给出一个合适的自我介绍，并且可能需要进一步了解用户的需求或兴趣。同时，用户提到了他叫Lanny，我可能需要记住这一点，以便在未来的对话中使用。另外，提供了两个工具：search_tool和calculator_tool。目前看来，这些工具可能不直接适用于当前的对话情境，因为用户似乎是在进行社交性的问候而不是寻求特定的信息或计算。然而，如果用户后续提出相关需求，我可以考虑使用这些工具来辅助回答。", "need_tool": "False", "tool": "", "tool_input": ""}}
    {{"thought": "首先，我需要理解用户的问题。用户想要知道广州今天的天气情况，这应该是要获取天气信息。我来想想，要得到天气信息，通常有几种方式。一是直接知道，但作为一个AI，我并不具备实时获取天气数据的能力，所以需要通过其他方式来获得这个信息。二是使用搜索引擎搜索天气信息，三是可能有专门的天气API，但在这个场景中，只有search_tool和calculator_tool两个工具可用。calculator_tool是用于执行两个数相乘的，这和获取天气信息没有直接关系，所以可以排除。那只剩下search_tool，也就是用于执行上网搜索。那么，我需要考虑如何利用search_tool来获取广州今天的天气信息。可能的思路是，通过search_tool搜索"广州今天天气"相关的关键词，然后从搜索结果中提取出天气信息。", "need_tool": "False", "tool": "", "tool_input": ""}}
    {{"thought": "我需要给出一个合适的自我介绍，并且可能需要进一步了解用户的需求或兴趣。同时，用户提到了他叫Lanny，我可能需要记住这一点，以便在未来的对话中使用。另外，提供了两个工具：search_tool和calculator_tool。目前看来，这些工具可能不直接适用于当前的对话情境，因为用户似乎是在进行社交性的问候而不是寻求特定的信息或计算。然而，如果用户后续提出相关需求，我可以考虑使用这些工具来辅助回答。", "need_tool": "Ture", "tool": "calculator_tool", "tool_input": ""}}
    {{"thought":"用户在询问广州今天的天气，这显然是一个天气查询的问题。作为一个AI助手，我需要提供准确的天气信息来满足用户的需求。首先，我需要确认用户所在的位置是否是广州，因为天气是与地理位置密切相关的。不过，用户明确指出了是广州的天气，所以这一点可以确定。接下来，我需要找到获取广州当前天气信息的方法。由于我是一个AI模型，没有直接访问实时数据的能力，所以需要借助外部工具或API来获取这些信息。在这个场景中，我有两个可用的工具：search_tool和calculator_tool。很明显，calculator_tool是用于数学计算的，与天气查询无关，所以可以排除。因此，我需要使用search_tool来进行网络搜索，以获取广州今天的天气信息。为了有效地使用search_tool，我需要构造一个合适的搜索查询，以便得到准确和有用的结果。可能的搜索查询可以是"广州今天天气"或者"广州实时天气"等。此外，我还需要考虑如何从搜索结果中提取出用户需要的天气信息，比如温度、降雨概率、风速等。这可能需要对搜索结果进行解析和筛选，以提供给用户一个清晰的答案。总之，我的计划是使用search_tool进行网络搜索，获取广州今天的天气信息，并将相关信息整理后回复给用户。","need_tool":"True","tool":"search_tool","tool_input":"广州今天天气"}}
    错误例子：
    基于用户输入和当前对话历史，思考下一步行动。用户输入:你知道我是谁？可用工具:['search_tool:用于执行上网搜索','calculator_tool:用于执行两个数相乘']请决定:1.是否需要使用工具2.如果需要，选择哪个工具3.使用什么参数调用工具对思考的结果以json格式进行返回，请严格按照此提示执行，每段不需要空行举一些例子：{{"thought":"用户似乎在询问我是谁，可能是在确认身份或者想要了解关于我的信息。由于这是一个对话的开始，我需要给出一个合适的自我介绍，并且可能需要进一步了解用户的需求或兴趣。同时，用户提到了他叫Lanny，我可能需要记住这一点，以便在未来的对话中使用。另外，提供了两个工具：search_tool和calculator_tool。目前看来，这些工具可能不直接适用于当前的对话情境，因为用户似乎是在进行社交性的问候而不是寻求特定的信息或计算。然而，如果用户后续提出相关需求，我可以考虑使用这些工具来辅助回答。","need_tool":"False","tool":"","tool_input":""}}
    {{"thought":"首先，我需要理解用户的问题。用户想要知道广州今天的天气情况，这应该是要获取天气信息。我来想想，要得到天气信息，通常有几种方式。一是直接知道，但作为一个AI，我并不具备实时获取天气数据的能力，所以需要通过其他方式来获得这个信息。二是使用搜索引擎搜索天气信息，三是可能有专门的天气API，但在这个场景中，只有search_tool和calculator_tool两个工具可用。calculator_tool是用于执行两个数相乘的，这和获取天气信息没有直接关系，所以可以排除。那只剩下search_tool，也就是用于执行上网搜索。那么，我需要考虑如何利用search_tool来获取广州今天的天气信息。可能的思路是，通过search_tool搜索"广州今天天气"相关的关键词，然后从搜索结果中提取出天气信息。","need_tool":"False","tool":"","tool_input":""}}
    {{"thought":"我需要给出一个合适的自我介绍，并且可能需要进一步了解用户的需求或兴趣。同时，用户提到了他叫Lanny，我可能需要记住这一点，以便在未来的对话中使用。另外，提供了两个工具：search_tool和calculator_tool。目前看来，这些工具可能不直接适用于当前的对话情境，因为用户似乎是在进行社交性的问候而不是寻求特定的信息或计算。然而，如果用户后续提出相关需求，我可以考虑使用这些工具来辅助回答。","need_tool":"Ture","tool":"calculator_tool","tool_input":""}}
    {{"thought":"用户在询问广州今天的天气，这显然是一个天气查询的问题。作为一个AI助手，我需要提供准确的天气信息来满足用户的需求。首先，我需要确认用户所在的位置是否是广州，因为天气是与地理位置密切相关的。不过，用户明确指出了是广州的天气，所以这一点可以确定。接下来，我需要找到获取广州当前天气信息的方法。由于我是一个AI模型，没有直接访问实时数据的能力，所以需要借助外部工具或API来获取这些信息。在这个场景中，我有两个可用的工具：search_tool和calculator_tool。很明显，calculator_tool是用于数学计算的，与天气查询无关，所以可以排除。因此，我需要使用search_tool来进行网络搜索，以获取广州今天的天气信息。为了有效地使用search_tool，我需要构造一个合适的搜索查询，以便得到准确和有用的结果。可能的搜索查询可以是"广州今天天气"或者"广州实时天气"等。此外，我还需要考虑如何从搜索结果中提取出用户需要的天气信息，比如温度、降雨概率、风速等。这可能需要对搜索结果进行解析和筛选，以提供给用户一个清晰的答案。总之，我的计划是使用search_tool进行网络搜索，获取广州今天的天气信息，并将相关信息整理后回复给用户。","need_tool":"True","tool":"search_tool","tool_input":"广州今天天气"}}

    严格按照例子的格式
    以JSON格式返回,只需要返回如下格式内容: {{"thought": "思考过程", "need_tool": "True/False", "tool": "工具名", "tool_input": "参数"}}

    """

    # 定义llm
    llm = ChatOpenAI(
        # model="qwen-max",
        model="qwq-32b-preview",
        temperature=0,
        max_tokens=300,
        api_key="sk-e5b047bd720744cf8fdb3902d9151bfc",
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        # model_kwargs={ "response_format": '' }
    )

    class ResponseFormatter(BaseModel):
        """Always use this tool to output your response to the user."""
        thought: str = Field(description="思考过程")  # ,是字典格式！！！
        need_tool: str = Field(description="是否需要调用工具,True/False")
        tool: str = Field(description="调用的工具名")
        tool_input: str = Field(description="调用工具的参数")

    # response = await llm.ainvoke(prompt)
    # 对第一次调用llm生成的数据进行 输出整理
    llm_with_tool = llm.bind_tools(tools=[ResponseFormatter])
    response = await llm_with_tool.ainvoke(prompt)

    res = response.content.replace('\n', '').replace(' ', '').strip()
    json_pattern = r'\{.*?\}'

    # 使用 re.findall 找到所有匹配的 JSON 字符串
    res = re.search(json_pattern, res, re.DOTALL).group(0)

    print("bot: ", res, type(response.content), '\n------')
    # print('dict: ',eval(res))
    try:
        result = json.loads(res)
    except Exception as e:
        return AgentState(
            messages=state.messages,
            current_input=state.current_input,
            thought=state.thought,
            selected_tool=state.selected_tool,
            tool_input=state.tool_input,
            tool_output=state.tool_output,
            final_answer=state.final_answer,
            status="chatbot"
        )

    print('是否需要工具', result["need_tool"])
    state = AgentState(
        messages=state.messages,
        current_input=state.current_input,
        thought=result["thought"],
        selected_tool=result.get("tool"),
        tool_input=result.get("tool_input"),
        tool_output=state.tool_output,
        final_answer=state.final_answer,
        status="GENERATE_RESPONSE" if result["need_tool"] == 'False' else "NEED_TOOL"
    )
    return state


async def execute_tool(state: AgentState) -> AgentState:
    """Execute the selected tool with the given input."""
    # tool 是什么？
    print(f"Tool Selected: {state.selected_tool}")
    print(f"Tool Input: {state.tool_input}")

    tool_to_use = None
    for tool in tools:
        if tool.name == state.selected_tool:
            tool_to_use = tool
            break

    if tool_to_use is None:
        state.tool_output = "Tool not found"
        state.status = "ERROR"
        return state

    try:
        print(tool_to_use, tool_to_use.name)
        
        # Check if the tool function has an ainvoke method
        if hasattr(tool_to_use.func, 'ainvoke'):
            result = await tool_to_use.func.ainvoke(state.tool_input)
        elif callable(tool_to_use.func):
            # If it's a regular async function, call it directly
            # Parse the tool input if it's a JSON string
            try:
                if state.tool_input and isinstance(state.tool_input, str):
                    # Try to parse as JSON
                    params = json.loads(state.tool_input)
                    if isinstance(params, dict):
                        result = await tool_to_use.func(**params)
                    else:
                        result = await tool_to_use.func(params)
                else:
                    # If not a string or empty, just call the function
                    result = await tool_to_use.func()
            except json.JSONDecodeError:
                # If not valid JSON, pass it as is
                result = await tool_to_use.func(state.tool_input)
        else:
            result = "Tool function is not callable"
            
        state.tool_output = str(result)
        state.status = "TOOL_EXECUTED"
        print(f"Tool Output: {state.tool_output}")
    except Exception as e:
        state.tool_output = f"Error executing tool: {str(e)}"
        state.status = "ERROR"
        print(f"Tool Error: {state.tool_output}")

    return state


async def generate_response(state: AgentState) -> AgentState:
    """生成最终响应"""
    prompt = f"""
    基于以下信息生成对用户的回复:
    用户输入: {state.current_input}
    思考过程: {state.thought}
    工具输出: {state.tool_output}

    请根据这些信息，生成一个简洁清晰、有帮助的回复。
    重点关注回复，不要有太多的思考过程，回答简洁明了
    举例：
        相对论是由阿尔伯特·爱因斯坦发明的。他在1905年提出了狭义相对论，并在1915年提出了广义相对论。这些理论彻底改变了我们对时间、空间和重力的理解，并对现代物理学产生了深远的影响。
    """

    # 定义llm
    llm = ChatOpenAI(
        # model="qwen-max",
        model="qwq-32b-preview",
        temperature=0.1,
        max_tokens=300,
        api_key="sk-e5b047bd720744cf8fdb3902d9151bfc",
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        # model_kwargs={ "response_format": '' }
    )
    response = await llm.ainvoke(prompt)
    print('最终结果res： ', response, type(response))
    return AgentState(
        messages=state.messages,
        current_input=state.current_input,
        thought=state.thought,
        selected_tool=state.selected_tool,
        tool_input=state.tool_input,
        tool_output=state.tool_output,
        final_answer=response.content,
        status="SUCCESS"
    )


async def error_handler(state: AgentState) -> AgentState:
    """错误处理"""
    return AgentState(
        messages=state.messages,
        current_input=state.current_input,
        thought=state.thought,
        selected_tool=state.selected_tool,
        tool_input=state.tool_input,
        tool_output=state.tool_output,
        status="ERROR",
        final_answer="Sorry, I encountered an error."
    )


# 创建图结构
workflow = StateGraph(AgentState)

# 添加节点
workflow.add_node("chatbot", chatbot)
workflow.add_node("execute_tool", execute_tool)
workflow.add_node("generate_response", generate_response)
workflow.add_node("error_handler", error_handler)


# 定义路由函数
def route_next_step(state: AgentState) -> str:
    if state.status == "ERROR":
        return "error"
    elif state.status == "NEED_TOOL":
        return "execute_tool"
    elif state.status == "GENERATE_RESPONSE":
        return "generate_response"
    elif state.status == "SUCCESS":
        return "end"
    elif state.status == "chatbot":
        return "chatbot"

    return "chatbot"


workflow.add_edge(START, "chatbot")  # 添加条件边
workflow.add_conditional_edges(
    "chatbot",
    route_next_step,
    {
        "execute_tool": "execute_tool",
        "generate_response": "generate_response",
        "error": "error_handler",
        "chatbot": "chatbot",
        # "end": END
    }
)

workflow.add_conditional_edges(
    "execute_tool",
    route_next_step,
    {
        "generate_response": "generate_response",
        "error": "error_handler",
        # "end": END
        "chatbot": "chatbot",
    }
)

workflow.add_edge("generate_response", END)
workflow.add_edge("error_handler", END)
# 增加内存功能
memory = MemorySaver()

# 编译图
# app = workflow.compile(checkpointer=memory)
app = workflow.compile()
# 生成图
mermaid_code = app.get_graph().draw_mermaid_png()
with open("chatbot-tool.jpg", "wb") as f:
    f.write(mermaid_code)


async def run_agent(state: AgentState):
    # 现在返回的是adddict类型
    final_state = await app.ainvoke(state)
    # print(final_state, type(final_state))
    # print(final_state['current_input'], type(final_state['current_input']))
    # 手动将消息添加到上下文
    state.messages.append({"role": "user", "content": final_state['current_input']})
    state.messages.append({"role": "ai", "content": final_state['final_answer']})
    print('\n消息列表：', state.messages, '\n')
    state.messages = state.messages[-5:]  # 保存最近5条消息的上下文   如果后续需要持久化保存消息的话，则每生成一次，将数据添加到数据库中
    state = AgentState(
        messages=state.messages,
        current_input=final_state['current_input'],
        thought=final_state['thought'],
        selected_tool=final_state['selected_tool'],
        tool_input=final_state['tool_input'],
        tool_output=final_state['tool_output'],
        final_answer=final_state['final_answer'],
        status=final_state['status'],
    )
    print('-----', state.final_answer)
    return state


# 使用示例
async def main():
    questions = [

        "谁发明了相对论？",
        "计算圆周率乘以10等于多少？",
        "计算230乘以458等于多少？",

    ]
    questions = [
        "我是lanny，你是谁？",
        "广州今天天气？",
        "你知道我是谁？",

    ]
    state = AgentState()
    for question in questions:
        print(f"\n问题: {question}")
        state.current_input = question
        answer = await run_agent(state)
        print(f"回答: {answer.final_answer}")


# 运行示例
import asyncio

asyncio.run(main())
