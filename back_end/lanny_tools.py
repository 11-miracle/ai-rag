import json
import logging
import os
import uuid
from datetime import datetime
import chromadb
import pymysql
import requests
from PyPDF2 import PdfReader
from chromadb.api.types import IncludeEnum
from chromadb.utils.embedding_functions.openai_embedding_function import OpenAIEmbeddingFunction
from docx import Document
from openai import OpenAI

from constant import LLM_BASE_URL, HOST, USER, PASSWORD, DATABASE, PORT


class Chatbot:
    def __init__(self):
        # 设置本地服务器地址
        self.client = OpenAI(base_url=f"{LLM_BASE_URL}/v1", api_key="lm_studio")
        # self.messages = [
        #     {"role": "system",
        #      "content": "你是专业的厨师，只能回答与做饭相关的问题。如果用户问到了其他问题，请拒绝回答。并返回'error"},
        #     # {"role": "system", "content": "你是一个合格的 AI 助手，擅长中英文对话。请用简洁、友好的方式回答问题。"},
        #     # {"role": "system", "content": "如果用户提出不合理或不安全的问题，请拒绝回答。"},
        #     # {"role": "system", "content": "如果用户需要帮助，请提供清晰的指导。"}
        #     # {"role": "user", "content": "你是谁"}
        # ]

    def chatbot(self, messages, query):
        context = get_context()
        messages.extend(context)
        # 进行rag
        res = search_in_vector_db(query)

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
            哟，你问啥子AI哦！不就是那种能自己动脑筋的机器嘛！就像电影里的机器人，能自己做决定，还能帮你干好多事。厉害得很哦，但有时候也像个智障，哈哈！
        """
        messages.append({"role": "user", "content": prompt})
        response = self.client.chat.completions.create(
            model="qwen2.5-7b-instruct-mlx",
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
            insert_context()

        return generate_response()


# 文件处理函数
def process_file(filepath: str) -> str:
    ext = os.path.splitext(filepath)[1].lower()

    if ext == '.pdf':
        text = ""
        with open(filepath, 'rb') as f:
            reader = PdfReader(f)
            for page in reader.pages:
                text += page.extract_text()

    elif ext == '.docx':
        doc = Document(filepath)
        text = '\n'.join([para.text for para in doc.paragraphs])

    elif ext == '.txt':
        with open(filepath, 'r') as f:
            text = f.read()

    else:
        raise ValueError("Unsupported file format")

    return text


# 文本分块函数
def chunk_text(text: str, max_tokens: int = 3000) -> list[str]:
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
def analyze_with_gpt(content: str, prompt: str) -> str:
    client = OpenAI(base_url=f"{LLM_BASE_URL}/v1", api_key="lm_studio")
    response = client.chat.completions.create(
        model="qwen2.5-7b-instruct-mlx",
        messages=[
            {"role": "system", "content": "你是一个专业文档分析助手"},
            {"role": "user", "content": f"{prompt}\n\n文档内容：{content}"}
        ],
        temperature=0.3
    )
    return response.choices[0].message.content


def embedding(text):
    url = f"{LLM_BASE_URL}/v1/embeddings"
    payload = {
        "input": text,
        "model": 'text-embedding-nomic-embed-text-v1.5'
    }
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        return response.json()["data"][0]["embedding"]
    else:
        raise Exception(f"Failed to get embedding: {response.status_code}, {response.text}")


openai_ef = OpenAIEmbeddingFunction(
    api_key="YOUR_API_KEY",
    model_name="text-embedding-nomic-embed-text-v1.5",
    api_base=f"{LLM_BASE_URL}/v1"
)


def vector_db_add(texts):
    # 初始化向量数据库
    persist_directory = './vector/chroma1'  # 持久化数据  存放处
    client = chromadb.PersistentClient(persist_directory)
    collection = client.get_or_create_collection(name="test2", embedding_function=openai_ef)
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


def search_in_vector_db(query):
    # 初始化向量数据库
    persist_directory = './vector/chroma1'  # 持久化数据存放处

    ector_db = chromadb
    client = chromadb.PersistentClient(persist_directory)
    collection = client.get_collection(name="test2", embedding_function=openai_ef)

    # 将查询文本转换为嵌入向量
    query_embedding = embedding(query)

    # 在向量数据库中搜索
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=2,
        # include=[IncludeEnum.documents, IncludeEnum.metadatas, IncludeEnum.distances]  # 使用 IncludeEnum 枚举
    )
    # logging.info(f"搜索结果---------------{results}")
    # logging.info(f"\ndoc结果---------------{results['documents'][0]}")
    return results['documents'][0][0]


def create_db():
    connection = pymysql.connect(host=HOST,
                                 user=USER,
                                 port=PORT,
                                 password=PASSWORD,
                                 database=DATABASE,
                                 charset='utf8mb4', )
    cursor = connection.cursor()
    return cursor


def insert_context(context):
    cursor = create_db()
    try:
        # 将字符串转换为字典
        context_dict = json.loads(context)

        # 插入数据
        cursor.execute("""
            INSERT INTO context (user_id, context_id, context) 
            VALUES (%s, %s, %s)
            """, (1, 1, f'{context_dict}')) # 使用 json.dumps 将字典转换为字符串存储
        cursor.connection.commit()  # 提交事务
        print("数据插入成功！")
        return {'status': True}
    except Exception as e:
        print(f"发生错误：{e}")
        return {'status': False, 'message': str(e)}
    finally:
        cursor.close()

def get_context():
    cursor = create_db()
    cursor.execute(f"""
    select * from context order by time DESC limit 10;
    """
    )
    history = cursor.fetchall()
    context_history = []
    for i in history:
        context_history.append(i[3])
    return context_history


