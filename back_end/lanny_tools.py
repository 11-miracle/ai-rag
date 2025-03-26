import csv
import json
import logging
import os
import uuid
from datetime import datetime
import chromadb
from PyPDF2 import PdfReader
from bs4 import BeautifulSoup
from chromadb.utils.embedding_functions.openai_embedding_function import OpenAIEmbeddingFunction
from openai import OpenAI
from dotenv import load_dotenv

from mysql_tools import DataBaseManage
from constant import LLM_CLOUD_URL, LLM_MODEL, MESSAGES


class Chatbot:
    def __init__(self):
        # 加载 .env 文件
        load_dotenv()
        api_key = os.getenv('QIANWEN_API_KEY')
        # 设置本地服务器地址
        # self.client = OpenAI(base_url=f"{LLM_BASE_URL}/v1", api_key="lm_studio")
        self.client = OpenAI(base_url=f"{LLM_CLOUD_URL}", api_key=api_key)
    """对话函数，没有实现上下文"""
    def chatbot(self, messages, query):
        # context = get_context()
        # messages.extend(context)
        # 进行rag
        embedding_func = EmbeddingFunc()
        res = embedding_func.search_in_vector_db(query)

        # logging.info(f"--------{messages}")
        # 构建提示词
        prompt = f"""
        # 指导原则
        在回答以下问题时，请遵循以下逻辑：
        1. **优先使用检索到的内容**：如果检索到的信息与问题直接相关，请根据这些信息生成回答。
        2. **补充 LLM 的知识**：如果检索到的内容与问题无关，或者不足以回答问题，请结合你自己的知识进行回答。

        # 检索到的内容
        以下是检索到的相关信息：
        - {res}

        # 用户问题
        {query}

        # 回答
        根据上述逻辑，请生成回答：

        示例：
            -哟，你问啥子AI哦！不就是那种能自己动脑筋的机器嘛！就像电影里的机器人，能自己做决定，还能帮你干好多事。厉害得很哦，但有时候也像个智障，哈哈！
            -哎哟喂，你们这些外地人，问起AI能干啥子，老子今天就给你们摆摆清楚！你们晓得不，我们四川现在连挑二荆条辣椒都要用AI来帮忙选，搞得比我们这些老四川人还专业！
            -哟，摆啥子龙门阵！你问啥子AI Agent，老子给你摆一摆！这玩意儿就是个高科技二哈，专门在电脑里面自己做主的智能体！它能自己看、自己听、自己想，还能自己动手干事情，比你家那只只会汪汪叫的狗子强多了！
        
        """
        messages.append({"role": "user", "content": prompt})
        # messages.append({"role": "user", "content": query})
        response = self.client.chat.completions.create(
            model=LLM_MODEL,
            # model="qwen2.5-7b-instruct-mlx",
            messages=messages,
            temperature=0.7,
            stream=True,
            max_tokens=2048,
        )

        def generate_response():
            assistant_response = ""
            response_chunks = []
            chunk_id = 1

            for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    assistant_response += content
                    # print(content, end='')
                    response_chunks.append({"chunk_id": chunk_id, "content": content})
                    chunk_id += 1
                    # logging.info(content)
                    yield content  # 流式返回每个 chunk 的内容
            messages.append({"role": "user", "content": query})
            messages.append({"role": "assistant", "content": assistant_response})

            # messages.append({"role": "user", "content": assistant_response})
            # 构造结构化输出
            structured_output = {
                "user_input": query,
                "model_response": assistant_response,
                "timestamp": datetime.utcnow().isoformat(),
                "messages": messages,
            }
            logging.info(structured_output)
            # 在流式返回的最后，返回结构化输出
            # yield f"{structured_output}"
            # insert_context()

        return generate_response()

    """对话函数，实现上下文存储，历史记录读取"""
    def chatbots(self, user_id, chatbot_id, query):
        messages = []
        # 获取上下文
        dataBM = DataBaseManage()
        context = dataBM.get_context(user_id, chatbot_id)
        logging.info(f"上下文--------{context}")
        # 将获取到的近10条上下文加入到messages中
        messages.extend(context)
        messages.extend(MESSAGES)
        messages.append({"role": "user", "content": query})
        # 进行rag
        embedding_func = EmbeddingFunc()
        res = embedding_func.search_in_vector_db(query)
        # logging.info(f"查询结果--------{res}")

        # 根据rag结果   构建提示词
        prompt = f"""
        # 指导原则
        在回答以下问题时，请遵循以下逻辑：
        1. **优先使用检索到的内容**：如果检索到的信息与问题直接相关，请根据这些信息生成回答。
        2. **补充 LLM 的知识**：如果检索到的内容与问题无关，或者不足以回答问题，请不要使用检索到的内容进行回答！！！请仅你自己的知识进行回答。

        # 检索到的内容
        以下是检索到的相关信息：
        - {res}

        # 用户问题
        {query}

        # 回答
        根据上述逻辑，请生成回答：

        示例：
            -哟，你问啥子AI哦！不就是那种能自己动脑筋的机器嘛！就像电影里的机器人，能自己做决定，还能帮你干好多事。厉害得很哦，但有时候也像个智障，哈哈！
            -哎哟喂，你们这些外地人，问起AI能干啥子，老子今天就给你们摆摆清楚！你们晓得不，我们四川现在连挑二荆条辣椒都要用AI来帮忙选，搞得比我们这些老四川人还专业！
            -哟，摆啥子龙门阵！你问啥子AI Agent，老子给你摆一摆！这玩意儿就是个高科技二哈，专门在电脑里面自己做主的智能体！它能自己看、自己听、自己想，还能自己动手干事情，比你家那只只会汪汪叫的狗子强多了！

        """
        # messages.append({"role": "user", "content": prompt.strip()})  # 添加strip()去除多余空白
        # logging.info(f'{messages},,{type(messages)}')
        try:
            logging.info(f",{type(messages)}")
            response = self.client.chat.completions.create(
                model=LLM_MODEL,
                messages=messages,
                temperature=0.7,
                stream=True,
                max_tokens=2048,
            )
        except Exception as e:
            logging.error(f"发生错误：{e}")
            return {'status': False, 'message': str(e)}

        def generate_response():
            assistant_response = ""
            response_chunks = []
            chunk_id = 1

            for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    assistant_response += content
                    # print(content, end='')
                    response_chunks.append({"chunk_id": chunk_id, "content": content})
                    chunk_id += 1
                    # logging.info(content)
                    yield content  # 流式返回每个 chunk 的内容
            messages.append({"role": "user", "content": query})
            messages.append({"role": "assistant", "content": assistant_response})

            # 构造结构化输出
            structured_output = {
                "user_input": query,
                "model_response": assistant_response,
                "timestamp": datetime.utcnow().isoformat(),
                "messages": messages,
            }
            # 在流式返回的最后，返回结构化输出
            # yield f"{structured_output}"
            a = {"role": "user", "content": query}
            b = {"role": "assistant", "content": assistant_response}
            dataBM.insert_context(user_id, chatbot_id, f"{a}",f"{b}")

            # insert_context(user_id, chatbot_id, f"{b}")

        return generate_response()


class EmbeddingFunc:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv('QIANWEN_API_KEY')
        self.client = OpenAI(base_url=f"{LLM_CLOUD_URL}", api_key=self.api_key)


        # openai_ef = OpenAIEmbeddingFunction(
        #     api_key="YOUR_API_KEY",
        #     model_name="text-embedding-nomic-embed-text-v1.5",
        #     api_base=f"{LLM_BASE_URL}/v1"
        # )
        """定义一个OpenAIEmbeddingFunction实例"""
        self.openai_ef = OpenAIEmbeddingFunction(
            api_key=self.api_key,
            model_name="text-embedding-v3",
            api_base=f"{LLM_CLOUD_URL}",
            dimensions=768,
        )

    """文件处理函数"""
    def process_file(self,filepath: str) -> str:
        ext = os.path.splitext(filepath)[1].lower()

        if ext == '.pdf':
            from PyPDF2 import PdfReader
            text = ""
            with open(filepath, 'rb') as f:
                reader = PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text()

        elif ext == '.docx':
            from docx import Document
            doc = Document(filepath)
            text = '\n'.join([para.text for para in doc.paragraphs])

        elif ext == '.pptx':
            from pptx import Presentation
            prs = Presentation(filepath)
            text = ""
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text += shape.text + "\n"
                    # 处理表格中的文本
                    if shape.has_table:
                        for row in shape.table.rows:
                            for cell in row.cells:
                                text += cell.text + "\t"
                            text += "\n"

        elif ext == '.xlsx':
            from openpyxl import load_workbook
            wb = load_workbook(filepath, read_only=True)
            text = ""
            for sheet in wb:
                for row in sheet.iter_rows(values_only=True):
                    text += "\t".join([str(cell) for cell in row]) + "\n"

        elif ext == '.md':
            with open(filepath, 'r', encoding='utf-8') as f:
                text = f.read()

        elif ext == '.html':
            with open(filepath, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f.read(), 'html.parser')
                text = soup.get_text(separator='\n')



        elif ext == '.csv':
            with open(filepath, 'r', newline='', encoding='utf-8') as f:
                reader = csv.reader(f)
                text = "\n".join([",".join(row) for row in reader])

        elif ext == '.txt':
            with open(filepath, 'r', encoding='utf-8') as f:
                text = f.read()

        else:
            raise ValueError(f"Unsupported file format: {ext}")

        # 统一清理文本格式
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        return text.strip()


    """文本分块函数"""
    def chunk_text(self,text: str, max_tokens: int = 3000) -> list[str]:
        words = text.split()
        chunks = []
        current_chunk = []

        for word in words:
            if len(current_chunk) + len(word) + 1 > max_tokens:  # +1 for space
                chunks.append(' '.join(current_chunk))
                current_chunk = []
            current_chunk.append(word)

        if current_chunk:
            chunks.append(' '.join(current_chunk))

        return chunks


    # OpenAI 分析函数
    def analyze_with_gpt(self,content: str, prompt: str) -> str:
        load_dotenv()
        api_key = os.getenv('QIANWEN_API_KEY')
        client = OpenAI(base_url=f"{LLM_CLOUD_URL}/v1", api_key=api_key)
        response = client.chat.completions.create(
            # model="qwen2.5-7b-instruct-mlx",
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "你是一个专业文档分析助手"},
                {"role": "user", "content": f"{prompt}\n\n文档内容：{content}"}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content

    """返回向量化数据"""
    def embedding(self,text):
        client = OpenAI(
            api_key=os.getenv("QIANWEN_API_KEY"),
            base_url=LLM_CLOUD_URL  # 百炼服务的base_url
        )

        completion = client.embeddings.create(
            model="text-embedding-v3",
            input=text,
            dimensions=768,
            encoding_format="float"
        )

        return completion.model_dump_json()


    # def embedding(text):
    #     url = f"{LLM_BASE_URL}/v1/embeddings"
    #     payload = {
    #         "input": text,
    #         "model": 'text-embedding-nomic-embed-text-v1.5'
    #     }
    #     response = requests.post(url, json=payload)
    #     if response.status_code == 200:
    #         return response.json()["data"][0]["embedding"]
    #     else:
    #         raise Exception(f"Failed to get embedding: {response.status_code}, {response.text}")



    """向向量数据库中添加数据"""
    def vector_db_add(self,texts):
        # 初始化向量数据库
        persist_directory = './vector/chroma2'  # 持久化数据  存放处
        client = chromadb.PersistentClient(persist_directory)
        # 添加了embedding函数
        collection = client.get_or_create_collection(name="test3", embedding_function=self.openai_ef)
        # 将文件添加到向量数据库中
        collection.add(
            documents=texts,
            metadatas=[{
                "source": "sample",
                "id": str(uuid.uuid4()),  # 生成唯一的 ID
                "timestamp": datetime.now().isoformat()  # 当前时间戳
            } for _ in texts],
            ids=[f"{uuid.uuid4()}{i}" for i in range(len(texts))]
        )
        logging.info('上传到向量数据库成功')

    """在向量数据库中搜索相似值"""
    def search_in_vector_db(self,query):
        # 初始化向量数据库
        persist_directory = './vector/chroma2'  # 持久化数据存放处

        client = chromadb.PersistentClient(persist_directory)
        collection = client.get_collection(name="test3", embedding_function=self.openai_ef)

        # 将查询文本转换为嵌入向量
        # query_embedding = embedding(query)

        # 在向量数据库中搜索
        results = collection.query(
            # query_embeddings=[query_embedding],
            query_texts=[query],
            n_results=1,
        )
        logging.info(f"-----{query},\n\n---{results}")
        if results['distances'][0][0] > 0.65:
            logging.info('未找到相关信息')
            return ''
        return results['documents'][0][0]




