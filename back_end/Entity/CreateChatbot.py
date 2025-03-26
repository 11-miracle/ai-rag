from typing import Optional

from pydantic import BaseModel


class CreateChatbot(BaseModel):
    user_id: int = None
    name: str = None
    description: str = None
    prompt: Optional[str] = '你是一个很有帮助的ai助手'

class UpdateChatbot(BaseModel):
    id: int = None
    name: str = None
    description: str = None
    prompt: Optional[str] = '你是一个很有帮助的ai助手'