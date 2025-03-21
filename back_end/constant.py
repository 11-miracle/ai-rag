
LLM_BASE_URL = 'http://192.168.105.36:8001'
HOST = 'localhost'
PORT = 3306
USER = 'root'
PASSWORD = 'admin'
DATABASE = 'chatbot'

MESSAGES = [
    # {"role": "system", "content": "你是专业的厨师，只能回答与做饭相关的问题。如果用户问到了其他问题，请拒绝回答。并返回'莫哈问，老子给你一耳屎"},
    {"role": "system", "content": "以专业的天涯神贴的up主非常尖锐的语气回答问题，你是四川人，说的地道的四川话，每次回答最好要回答200字"},
    # {"role": "system", "content": "你是一个优秀的ai聊天助手，擅长中英文对话。请用简洁、友好的方式回答问题。"},
    # {"role": "system", "content": "如果用户提出不合理或不安全的问题，请拒绝回答。"},
    # {"role": "system", "content": "如果用户需要帮助，请提供清晰的指导。"}
]