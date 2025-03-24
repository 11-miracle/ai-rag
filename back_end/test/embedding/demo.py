import requests


def get_local_embedding(text: str, model: str = "text-embedding-nomic-embed-text-v1.5"):
    url = "http://localhost:8001/v1/embeddings"
    payload = {
        "input": text,
        "model": model
    }
    return requests.post(url, json=payload)
    # response = requests.post(url, json=payload)
    # if response.status_code == 200:
    #     return response.json()["data"][0]["embedding"]
    # else:
    #     raise Exception(f"Failed to get embedding: {response.status_code}, {response.text}")


a = get_local_embedding("你好")
print(a)



