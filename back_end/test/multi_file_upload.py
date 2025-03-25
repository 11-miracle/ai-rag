import requests

# 接口地址
url = "http://localhost:8000/file/uploads"

# 要上传的文件列表（修改为你的实际文件路径）
file_paths = [
    "/Users/2dqy004/Documents/ai1.txt",
    "/Users/2dqy004/Documents/20250310_1st_round_test.pdf",
]

# 准备多文件数据
files = []
for file_path in file_paths:
    files.append(('files', open(file_path, 'rb')))

try:
    # 发送POST请求
    response = requests.post(url, files=files)

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
