from langchain_community.document_loaders import PyMuPDFLoader
pdf_path = "/Users/2dqy004/Documents/20250310_1st_round_test.pdf"
loader = PyMuPDFLoader(pdf_path)  # 每页返回一个document文档  是个列表，需要遍历获取
data = loader.load()
print(data)


