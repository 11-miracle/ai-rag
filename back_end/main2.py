import logging
import os
import uuid
from typing import List

from starlette.responses import StreamingResponse, JSONResponse

from Entity.CreateChatbot import CreateChatbot, UpdateChatbot
from mysql_tools import DataBaseManage

from constant import MESSAGES

from lanny_tools import Chatbot, EmbeddingFunc
from Entity.RequestClass import UsernameRequest, ChatbotRequest, FileUploadRequest
from fastapi import FastAPI, UploadFile, File, Form
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

dataBM = DataBaseManage()
embeddingFunc = EmbeddingFunc()


@app.get("/")
# 修改函数名以避免冲突
async def root_hello():
    return {"message": "Hello World, I'm a chatbot🤖"}


@app.get("/test")
async def root(question: str):
    return {"message": f"{question}\n hello,I don't know✈️🚄"}


@app.get("/test/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


"""无对话上下文"""


@app.get("/chatbot")
async def chatbot(query: str | None = None):
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

    logging.info(f"{chatbots.query},{chatbots.user_id},{chatbots.chatbot_id}")
    res = chatbot.chatbots(chatbots.user_id, chatbots.chatbot_id, chatbots.query)

    # 创建一个异步生成器来处理流式响应
    return StreamingResponse(res, media_type="application/json")


@app.post("/user/get_uid_by_username")
async def get_uid_by_username(username: UsernameRequest):  # 接受一个json文件
    # 获取数据库对象
    dataDM = DataBaseManage()
    conn = dataDM.create_connection()
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
        chatbot_id: int = Form(...),
        # fileUploadRequest = FileUploadRequest

):
    """根据chatbot_id获取collection_name"""
    collection_name = dataBM.get_col_name_by_chatbot_id(chatbot_id)['data']

    logging.info(f"Received chatbot_id: {chatbot_id}")
    logging.info(f"Received collection_name: {collection_name}")


    # 文件上传目录
    UPLOAD_FOLDER = 'uploads'
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    results = []

    for file in files:
        file_id = str(uuid.uuid4())
        if file.filename:
            filetype = file.filename.split('.')[-1]
        else:
            filetype = 'unknown'
        filepath = os.path.join(UPLOAD_FOLDER, file_id + f'.{filetype}')
        logging.info(f"Processing file: {file.filename}")

        try:
            # 保存文件
            with open(filepath, 'wb') as f:
                content = await file.read()
                f.write(content)
            embeddingFunc = EmbeddingFunc()
            # 处理文件内容
            text = embeddingFunc.process_file(filepath)
            # 分割文本
            chunks = embeddingFunc.chunk_text(text)
            # 向向量数据库添加数据
            embeddingFunc.vector_db_add(chunks, collection_name)
            logging.info(f"demo3")


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
    dataBM = DataBaseManage()
    history = dataBM.get_history(user_id, chatbot_id)
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
    dataBM = DataBaseManage()
    chatbots = dataBM.get_chatbot_from_user(user_id)
    logging.info(chatbots)
    return JSONResponse({
        "status": "success",
        "data": chatbots
    })


"""创建一个新的agent"""


@app.post("/create_agent")
async def create_agent(
        createChatbot: CreateChatbot
):
    logging.info(
        f"Received params: {createChatbot.user_id},"
        f"{createChatbot.name},"
        f"{createChatbot.description},"
        f"{createChatbot.prompt} ")

    dataBM = DataBaseManage()
    res = dataBM.create_chatbot(createChatbot.user_id, createChatbot.name, createChatbot.description,
                                createChatbot.prompt)
    return JSONResponse(res)


"""更新agent"""


@app.post("/update_agent")
async def update_agent(
        updateChatbot: UpdateChatbot
):
    logging.info(
        f"Received params: {updateChatbot.id},"
        f"{updateChatbot.name},"
        f"{updateChatbot.description},"
        f"{updateChatbot.prompt} ")
    dataBM = DataBaseManage()
    res = dataBM.update_chatbot(updateChatbot.id, updateChatbot.name, updateChatbot.description,
                                updateChatbot.prompt)
    return res
