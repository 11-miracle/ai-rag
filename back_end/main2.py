import logging
import os
import uuid

from PyPDF2 import PdfReader
from docx import Document
from openai import OpenAI
from starlette.responses import StreamingResponse, JSONResponse

from mysql_tools import create_connection
from constant import MESSAGES
from lanny_tools import Chatbot, process_file, chunk_text, analyze_with_gpt, embedding, vector_db_add, \
    search_in_vector_db, get_context
from request_class import UsernameRequest, ChatbotRequest
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from starlette.middleware.cors import CORSMiddleware

app = FastAPI()
# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境应指定具体域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有头
)
# 在FastAPI应用启动前添加日志配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


@app.get("/")
async def root():
    return {"message": "Hello World, I'm a chatbot🤖"}


@app.get("/test")
async def root(question: str):
    return {"message": f"{question}\n hello,I don't know✈️🚄"}


@app.get("/test/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


# 无对话上下文
@app.get("/chatbot")
async def chatbot(query: str = None):
    if query is None:
        return {"message": "Hello, World!"}
    logging.debug(f"Received name: {query}")
    chatbot = Chatbot()
    # get_context()
    res = chatbot.chatbot(MESSAGES, query)

    # 创建一个异步生成器来处理流式响应
    return StreamingResponse(res, media_type="application/json")


# 有对话上下文
@app.post("/chatbots")
async def chatbots(
        chatbots: ChatbotRequest
):
    logging.debug(f"Received name: {chatbots.query}")
    chatbot = Chatbot()
    get_context(chatbots.user_id, chatbots.chatbot_id)
    logging.info(f"{chatbots.query},{chatbots.user_id},{chatbots.chatbot_id}")
    res = chatbot.chatbots(chatbots.user_id, chatbots.chatbot_id, chatbots.query)

    # 创建一个异步生成器来处理流式响应
    return StreamingResponse(res, media_type="application/json")


@app.post("/get_uid_by_username")
async def get_uid_by_username(username: UsernameRequest):  # 接受一个json文件
    # 获取数据库对象
    conn = create_connection()
    cursor = conn.cursor()
    logging.info(username.username)
    # 查询用户ID
    cursor.execute("SELECT id FROM Users WHERE username = %s", (username.username,))
    result = cursor.fetchall()
    # 关闭数据库连接
    cursor.close()
    conn.close()

    return result


# API 路由
@app.post("/uploads")
async def upload(
        file: UploadFile = File(...),  # 上传的文件
):
    # 文件上传目录
    UPLOAD_FOLDER = 'uploads'
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    logging.info(f"Received file: {file.filename}")
    filetype = file.filename.split('.')[-1]

    # 保存文件
    file_id = str(uuid.uuid4())
    filepath = os.path.join(UPLOAD_FOLDER, file_id + f'.{filetype}')
    logging.info(f"Received file: {filepath}")
    with open(filepath, 'wb') as f:
        f.write(await file.read())

    try:
        # 提取文本
        text = process_file(filepath)
        chunks = chunk_text(text)
        # 向向量数据库添加数据
        vector_db_add(chunks)
        return JSONResponse({
            "status": "success",
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # 清理临时文件
        if os.path.exists(filepath):
            os.remove(filepath)


@app.get("/search")
async def search(query: str):
    logging.info(query)

    res = search_in_vector_db(query)
    logging.info(f"----=-==-=-{res}")
    return JSONResponse({
        "status": "success",
        "data": res
    })
