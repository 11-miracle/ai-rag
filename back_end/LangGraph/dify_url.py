import json
import requests
api_key = 'app-7kPo22tGuyw4EObIko4lb02B'



headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json',
}

json_data = {
    'inputs': {},
    'query': '广州今天的天气?',
    'response_mode': 'streaming',  # streaming  blocking
    'conversation_id': '',
    'user': 'lanny',
    'files': [
        # {
        #     'type': 'TXT',
        #     'transfer_method': 'local_file',  # remote_url
        #     # 'url': 'https://cloud.dify.ai/logo/logo-site.png',
        #     'upload_file_id': 'e3ff0fd0-5520-4be3-90ec-a3dd381ec71c',
        # },
    ],
}

response = requests.post('http://192.168.105.22/v1/chat-messages', headers=headers, json=json_data, stream=True)
print(response.json())
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
except Exception as e:
    print(f"Error: {e}")
    print("\nProcess interrupted by user")
finally:
    print()  # 确保最后换行