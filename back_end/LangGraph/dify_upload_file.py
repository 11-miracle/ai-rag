
import requests

api_key = 'app-7kPo22tGuyw4EObIko4lb02B'

# 设置请求的 URL 和 API 密钥
url = "http://192.168.105.22/v1/files/upload"

# 设置请求的文件和表单数据
# files = {
#     "file": ("/Users/2dqy004/PycharmProjects/fastApiProject/test.json", open("/Users/2dqy004/PycharmProjects/fastApiProject/test.json", "rb"), ""),  # 替换为实际文件路径和类型
#     "user": (None, "abc-123")  # 表单数据
# }
file_path = "/Users/2dqy004/Downloads/20250306_2nd_round_test.docx"
files = {"file": (open(file_path, 'rb'), 'docx'),
         "user": (None, "abc-123")
         }
# 设置请求头
headers = {
    "Authorization": f"Bearer {api_key}"
}

# 发送 POST 请求
response = requests.post(url, headers=headers, files=files)

# 打印响应内容
print("Response Status Code:", response.status_code)
print("Response Content:", response.json())