import logging
import os
import uuid
from typing import List

from PyPDF2 import PdfReader
from docx import Document
from openai import OpenAI
from starlette.responses import StreamingResponse, JSONResponse

from mysql_tools import create_connection, get_history, get_chatbot_from_user

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


"""无对话上下文"""
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


"""有对话上下文"""
@app.post("/chat/chatbots")
async def chatbots(
        # 使用json字符串发送请求，
        chatbots: ChatbotRequest
):
    logging.debug(f"Received name: {chatbots.query}")
    chatbot = Chatbot()
    get_context(chatbots.user_id, chatbots.chatbot_id)
    logging.info(f"{chatbots.query},{chatbots.user_id},{chatbots.chatbot_id}")
    res = chatbot.chatbots(chatbots.user_id, chatbots.chatbot_id, chatbots.query)

    # 创建一个异步生成器来处理流式响应
    return StreamingResponse(res, media_type="application/json")


@app.post("/user/get_uid_by_username")
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


"""
上传文件到向量数据库
可以接收多个文件，进行处理，然后上传到向量数据库
返回一个json文件，包含状态，details
"""



@app.post("/file/uploads")
async def upload(
        files: List[UploadFile] = File(...),  # 接收文件列表
):
    # 文件上传目录
    UPLOAD_FOLDER = 'uploads'
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    results = []

    for file in files:
        file_id = str(uuid.uuid4())
        filetype = file.filename.split('.')[-1]
        filepath = os.path.join(UPLOAD_FOLDER, file_id + f'.{filetype}')
        logging.info(f"Processing file: {file.filename}")

        try:
            # 保存文件
            with open(filepath, 'wb') as f:
                content = await file.read()
                f.write(content)

            # 处理文件内容
            text = process_file(filepath)
            # 分割文本
            chunks = chunk_text(text)
            # 向向量数据库添加数据
            vector_db_add(chunks)

            results.append({
                "filename": file.filename,
                "status": "success",
                "file_id": file_id
            })

        except ValueError as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "detail": str(e)
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "detail": f"Internal error: {str(e)}"
            })
            logging.error(f"Error processing {file.filename}: {str(e)}")
        finally:
            # 清理临时文件
            if os.path.exists(filepath):
                os.remove(filepath)

    # 检查是否有错误
    if any(res["status"] == "error" for res in results):
        return JSONResponse(
            status_code=207,  # Multi-Status
            content={"status": "partial_success", "details": results}
        )
    else:
        return JSONResponse(
            content={"status": "success", "details": results}
        )


"""弃用"""


@app.get("/search")
async def search(query: str):
    logging.info(query)

    res = search_in_vector_db(query)
    logging.info(f"----=-==-=-{res}")
    return JSONResponse({
        "status": "success",
        "data": res
    })


"""
获取历史记录
接受一个user_id和chatbot_id
返回一个history列表
"""


@app.post("/chat/get_history")
async def history(
        # 使用表单数据发送请求
        user_id: int = Form(...),
        chatbot_id: int = Form(...),
):
    logging.info(f"Received name: {user_id},{chatbot_id}")
    history = get_history(user_id, chatbot_id)
    return JSONResponse({
        "status": "success",
        "data": history
    })


"""
获取用户有多少个chatbot
接收一个user_id
返回一个chatbot列表
"""


@app.get("/user/get_chatbots_from_user")
async def get_chatbots(
        # 使用表单数据发送请求
        user_id: int = Form(...),
):
    chatbots = get_chatbot_from_user(user_id)
    logging.info(chatbots)
    return JSONResponse({
        "status": "success",
        "data": chatbots
    })
