"""import requests

# 目标 URL
# url = 'http://192.168.105.30:8000/uploads'
url = 'http://43.134.175.26:8000/uploads'

# 要上传的文件路径
# file_path = '/Users/2dqy004/Downloads/21.html'
# file_path = '/Users/2dqy004/Downloads/test.docx'
file_path = '/Users/2dqy004/Documents/ai1.txt'
# file_path = '/Users/2dqy004/Documents/20250310_1st_round_test.pdf'
# file_path = '/Users/2dqy004/Documents/work.png'
# file_path = '/Users/2dqy004/Downloads/wx_camera_1741145616930.mp4'
# file_path = '/Users/2dqy004/Downloads/基于大模型的RAG应用开发与优化——构建企业级LLM应用pdf.pdf'

# # 打开文件并发送 POST 请求
# with open(file_path, 'rb') as f:
#     files = {'file': (f.name, f, 'application/pdf')}
#     response = requests.post(url, files=files)

response = requests.post(url, files={'file': open(file_path, 'rb')})
# 检查响应
if response.ok:
    print('File uploaded successfully.')
    print(response.json())  # 打印服务器返回的 JSON 响应
else:
    print('Failed to upload file:', response.status_code, response.text)"""

import aiohttp
import asyncio
import json


file_paths = [
    "/Users/2dqy004/Documents/ai1.txt",
    "/Users/2dqy004/Documents/20250310_1st_round_test.pdf",
]

files = []
for file_path in file_paths:
    files.append(('files', open(file_path, 'rb')))
# 定义请求数据
file_upload_request = {
    "user_id": 123,  # 示例用户ID，根据实际情况修改
    "files":files
}

# 定义请求的URL
url = "http://127.0.0.1:8000/file/uploads"  # 替换为你的服务器地址

async def upload_file():
    async with aiohttp.ClientSession() as session:
        # 将请求数据转换为JSON格式
        data = json.dumps(file_upload_request)
        headers = {
            "Content-Type": "application/json"  # 设置请求头为JSON格式
        }
        async with session.post(url, data=data, headers=headers) as response:
            # 打印响应状态码和响应内容
            print(f"Response status: {response.status}")
            response_data = await response.json()
            print(f"Response data: {response_data}")

# 运行异步请求
asyncio.run(upload_file())