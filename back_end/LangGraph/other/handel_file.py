import requests
import json

# 测试接口的 URL
url = "http://127.0.0.1:8000/analyze"  # 替换为你的实际接口地址

# 要上传的文件路径
file_path = "/Users/2dqy004/Documents/20250310_1st_round_test.pdf"  # 替换为实际文件路径

# 用户问题
query = "请总结这个文档"

# 打开文件并发送 POST 请求
with open(file_path, "rb") as file:
    files = {"file": file}
    data = {"query": query}
    response = requests.post(url, files=files, data=data)

# 打印响应内容
print("响应状态码:", response.status_code)
print("响应内容:")
print(json.dumps(response.json(), indent=4, ensure_ascii=False))