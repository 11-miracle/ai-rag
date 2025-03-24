import json
import os
import re
from datetime import datetime
from typing import List, Dict, Optional

from langchain_ollama import OllamaEmbeddings
from langchain_community.tools import TavilySearchResults
from langchain_chroma import Chroma
from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI
from langchain_text_splitters import CharacterTextSplitter, RecursiveCharacterTextSplitter
from langgraph.checkpoint.memory import MemorySaver
from langgraph.constants import END, START
from langgraph.graph import StateGraph
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware  # 添加这行





class AgentState(BaseModel):
    messages: List[Dict[str, str]] = []
    current_input: str = ""
    thought: str = ""
    selected_tool: Optional[str] = None
    tool_input: str = ""
    tool_output: str = ""
    final_answer: str = ""
    status: str = "STARTING"


class ResponseFormatter(BaseModel):
    """Always use this tool to output your response to the user."""
    thought: str = Field(description="思考过程")
    need_tool: str = Field(description="是否需要调用工具,True/False")
    tool: str = Field(description="调用的工具名")
    tool_input: str = Field(description="调用工具的参数")


class Agent:
    def __init__(self):
        self.model = "qwq-32b-preview"
        self.temperature = 0
        self.max_tokens = 300
        self.api_key = "sk-e5b047bd720744cf8fdb3902d9151bfc"
        self.base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
        self.state = AgentState()
        self.tools = self._initialize_tools()
        self.graph = self._initialize_graph()

    def _initialize_tools(self):
        os.environ["TAVILY_API_KEY"] = "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"
        search_tool = TavilySearchResults(max_results=2, time_range="day")

        async def calculator_tool(a: int, b: int):
            return a * b

        async def get_now_time():
            return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        tools = [
            Tool(
                name="search_tool",
                description="用于执行上网搜索",
                func=search_tool
            ),
            Tool(
                name="calculator_tool",
                description="用于执行两个数相乘",
                func=calculator_tool
            ),
            Tool(
                name="get_now_time",
                description="与时间相关的，优先使用这个工具，用于获取当前时间",
                func=get_now_time
            )
        ]
        return tools

    def _initialize_graph(self):
        workflow = StateGraph(AgentState)
        workflow.add_node("chatbot", self._chatbot)
        workflow.add_node("execute_tool", self._execute_tool)
        workflow.add_node("generate_response", self._generate_response)
        workflow.add_node("error_handler", self._error_handler)

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

        workflow.add_edge("start", "chatbot")
        workflow.add_conditional_edges(
            "chatbot",
            route_next_step,
            {
                "execute_tool": "execute_tool",
                "generate_response": "generate_response",
                "error": "error_handler",
                "chatbot": "chatbot",
            }
        )
        workflow.add_conditional_edges(
            "execute_tool",
            route_next_step,
            {
                "generate_response": "generate_response",
                "error": "error_handler",
                "chatbot": "chatbot",
            }
        )
        workflow.add_edge("generate_response", "end")
        workflow.add_edge("error_handler", "end")
        return workflow.compile()

    async def _chatbot(self, state: AgentState) -> AgentState:
        prompt = f"""
        基于用户输入和当前对话历史，思考下一步行动。
        用户输入: {state.current_input}
        可用工具: {[t.name + ': ' + t.description for t in self.tools]}

        请决定:
        1. 是否需要使用工具
        2. 如果需要，选择哪个工具
        3. 使用什么参数调用工具
        不需要打印出思考过程，我只需要最终结果
        对思考的结果以json格式进行返回，请严格按照此提示执行，每段不需要空行    
        """
        llm = ChatOpenAI(
            model=self.model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            api_key=self.api_key,
            base_url=self.base_url,
            streaming=True,
        )
        llm_with_tool = llm.bind_tools(tools=[ResponseFormatter])
        response = await llm_with_tool.ainvoke(prompt)
        res = response.content.replace('\n', '').replace(' ', '').strip()
        json_pattern = r'\{.*?\}'
        try:
            res = re.search(json_pattern, res, re.DOTALL).group(0)
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

    async def _execute_tool(self, state: AgentState) -> AgentState:
        tool_to_use = None
        for tool in self.tools:
            if tool.name == state.selected_tool:
                tool_to_use = tool
                break
        if tool_to_use is None:
            state.tool_output = "Tool not found"
            state.status = "ERROR"
            return state
        try:
            if hasattr(tool_to_use.func, 'ainvoke'):
                result = await tool_to_use.func.ainvoke(state.tool_input)
            elif callable(tool_to_use.func):
                try:
                    if state.tool_input and isinstance(state.tool_input, str):
                        params = json.loads(state.tool_input)
                        if isinstance(params, dict):
                            result = await tool_to_use.func(**params)
                        else:
                            result = await tool_to_use.func(params)
                    else:
                        result = await tool_to_use.func()
                except json.JSONDecodeError:
                    result = await tool_to_use.func(state.tool_input)
            else:
                result = "Tool function is not callable"
            state.tool_output = str(result)
            state.status = "TOOL_EXECUTED"
        except Exception as e:
            state.tool_output = f"Error executing tool: {str(e)}"
            state.status = "ERROR"
        return state

    async def _generate_response(self, state: AgentState) -> AgentState:
        prompt = f"""
        基于以下信息生成对用户的回复:
        用户输入: {state.current_input}
        工具输出: {state.tool_output}
        请根据这些信息，进行汇总，生成一个简洁清晰、有帮助的回复。
        重点关注回复，不要有太多的思考过程，回答简洁明了
        """
        llm = ChatOpenAI(
            model="qwq-plus",
            temperature=0.1,
            max_tokens=1000,
            api_key=self.api_key,
            base_url=self.base_url,
            streaming=True,
        )
        response = await llm.ainvoke(prompt)
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

    async def _error_handler(self, state: AgentState) -> AgentState:
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

    async def run_agent(self, query: str):
        self.state.current_input = query
        final_state = await self.graph.ainvoke(self.state)
        self.state.messages.append({"role": "user", "content": final_state['current_input']})
        self.state.messages.append({"role": "ai", "content": final_state['final_answer']})
        self.state.messages = self.state.messages[-5:]
        self.state = AgentState(
        messages=self.state.messages,
        current_input=final_state['current_input'],
        thought=final_state['thought'],
        selected_tool=final_state['selected_tool'],
        tool_input=final_state['tool_input'],
        tool_output=final_state['tool_output'],
        final_answer=final_state['final_answer'],
        status=final_state['status'],
        )
        print('-----', self.state.final_answer)
        return self.state

if __name__ == '__main__':
    agent = Agent()
    agent.run_agent('你好')