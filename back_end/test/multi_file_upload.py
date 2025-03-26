import requests

"""创建一个agent"""
json = {
    "user_id": 2,
    "name": "深情王二3",
    "description": "you are a helpful assistant",
    "prompt": ""
}
# 发送POST请求
response = requests.post("http://127.0.0.1:8000/create_agent", json=json)
res = response.json()
collection_name = res["collection_name"]
chatbot_id = res["chatbot_id"]
print(collection_name)




# 接口地址
url = "http://localhost:8000/file/uploads"

# 要上传的文件列表（修改为你的实际文件路径）
file_paths = [
    "/Users/2dqy004/Downloads/基于评论数据的满意度模型设计研究.pdf"
]

# 准备多文件数据
files = []
for file_path in file_paths:
    files.append(('files', open(file_path, 'rb')))

try:
    # 发送POST请求
    response = requests.post(url, files=files,data={"chatbot_id": f"{chatbot_id}"})

    # 打印响应结果
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(response.json())

except Exception as e:
    print(f"Request failed: {str(e)}")

finally:
    # 确保关闭所有打开的文件
    for file in files:
        file[1].close()