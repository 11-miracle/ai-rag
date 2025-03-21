# 导入ChromaDB客户端库
import chromadb
import requests
from chromadb.utils.embedding_functions.openai_embedding_function import OpenAIEmbeddingFunction

openai_ef = OpenAIEmbeddingFunction(
                api_key="YOUR_API_KEY",
                model_name="text-embedding-nomic-embed-text-v1.5:2",
                api_base="http://192.168.105.5:8001/v1"
            )

# 创建ChromaDB客户端实例（默认使用内存存储）
chroma_client = chromadb.Client()

# 创建名为"my_collection"的集合（类似数据库表）
collection = chroma_client.get_or_create_collection(name="test_collection", embedding_function=openai_ef)

# 向集合添加文档数据
collection.add(
    documents=[
        "This is a document about pineapple",  # 文档1：关于菠萝
        "This is a document about oranges"     # 文档2：关于橙子
    ],
    ids=["id1", "id2"]  # 为每个文档指定唯一ID
)

# 执行相似性查询
results = collection.query(
    query_texts=["This is a query document about hawaii"],  # 查询文本（夏威夷相关）
    n_results=2  # 返回最相似的2个结果
)

# 打印查询结果（包含相似文档及其距离分数）
print(results)
