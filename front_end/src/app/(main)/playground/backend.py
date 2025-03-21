import json

api_key = 'app-7kPo22tGuyw4EObIko4lb02B'

import requests

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json',
}

json_data = {
    'inputs': {},
    'query': '什么是ai agent?',
    'response_mode': 'streaming',
    'conversation_id': '',
    'user': 'abc-123',
    'files': [
        # {
        #     'type': 'image',
        #     'transfer_method': 'remote_url',
        #     'url': 'https://cloud.dify.ai/logo/logo-site.png',
        # },
    ],
}

response = requests.post('http://192.168.105.22/v1/chat-messages', headers=headers, json=json_data, stream=True)

# 优化后的流式处理
buffer = ""
try:
    for chunk in response.iter_lines():
        if chunk:
            chunk_str = chunk.decode('utf-8')
            if chunk_str.startswith('data: '):
                # 处理完整消息
                message = chunk_str[6:]  # 去掉 'data: ' 前缀
                try:
                    message_json = json.loads(message)
                    if message_json.get('event') == 'message':
                        # 只打印新增内容
                        new_content = message_json.get('answer', '')
                        print(new_content, end='', flush=True)
                        buffer += new_content
                except json.JSONDecodeError:
                    continue
except KeyboardInterrupt:
    print("\nProcess interrupted by user")
finally:
    print()  # 确保最后换行