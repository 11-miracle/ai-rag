from pydantic import BaseModel


# 定义请求体模型
class UsernameRequest(BaseModel):
    username: str


"""
chatbot请求
    post
    请求体：
        query: str = None,
        user_id: int = None,
        chatbot_id: int = None,
    返回：
        StreamingResponse(res, media_type="application/json")
"""
class ChatbotRequest(BaseModel):
    user_id: int = None
    chatbot_id: int = None
    query: str = None



