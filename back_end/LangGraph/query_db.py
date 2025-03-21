import requests

query = '什么是ai'
url = f'http://192.168.105.36:8000/search?query={query}'
response = requests.get(url)
print(response.json())


