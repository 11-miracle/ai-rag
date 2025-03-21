import requests

# 目标 URL
url = 'http://192.168.105.36:8000/uploads'

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
    print('Failed to upload file:', response.status_code, response.text)