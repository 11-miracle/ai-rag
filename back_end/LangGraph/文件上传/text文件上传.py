from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter, RecursiveCharacterTextSplitter
import whisper  # 使用 whisper 库处理音频文件
# from langchain_community.document_loaders import (
#     TextLoader,  # 纯文本文件
#     UnstructuredWordDocumentLoader,  # Word 文档
#     UnstructuredExcelLoader,  # Excel 文件
#     UnstructuredPowerPointLoader,  # PowerPoint 文件
#     UnstructuredMarkdownLoader,  # Markdown 文件
#     PyMuPDFLoader,  # PDF 文件
#     UnstructuredHTMLLoader,  # HTML 文件
#     UnstructuredEmailLoader,  # 电子邮件
#     CSVLoader,  # CSV 文件
#     JSONLoader,  # JSON 文件
#     UnstructuredImageLoader,  # 图像文件
#     UnstructuredAudioLoader,  # 音频文件
#     UnstructuredVideoLoader  # 视频文件
# )

from langchain_community.document_loaders import (
    UnstructuredWordDocumentLoader,  # 需要安装额外的库 python-docx
    UnstructuredExcelLoader,  # 需要安装额外的库networkx, pandas
    UnstructuredPowerPointLoader,  # PowerPoint 文件
    UnstructuredMarkdownLoader,  # Markdown 文件
    PyMuPDFLoader,  # PyMuPDF
    UnstructuredHTMLLoader,
    JSONLoader,  # JSON 文件
)

"""text"""
# raw_documents = TextLoader('/Users/2dqy004/Downloads/20250306_2nd_round_test.docx',).load()  # ,encoding='gbk'
"""word格式"""
# raw_documents = UnstructuredWordDocumentLoader('/Users/2dqy004/Downloads/20250306_2nd_round_test.docx', mode="single",
#                                                strategy="fast", ).load()
"""excel"""
# raw_documents = UnstructuredExcelLoader('/Users/2dqy004/Downloads/Important.xlsx', mode="single",
#                                                strategy="fast", ).load()
"""ppt"""
# raw_documents = UnstructuredPowerPointLoader('/Users/2dqy004/Downloads/数据挖掘与可视化创意方案-以2023广东省专精特新企业科创水平为例.pptx', mode="elements",).load()
# raw_documents = UnstructuredPowerPointLoader('/Users/2dqy004/Downloads/1绪论.pptx', mode="single",).load()

"""markdown"""
# raw_documents = UnstructuredMarkdownLoader('/Users/2dqy004/PycharmProjects/fastApiProject/back_end/nihao.md', mode="single",).load()
"""pdf"""
# raw_documents = PyMuPDFLoader('/Users/2dqy004/Documents/20250310_1st_round_test.pdf', mode="single", ).load()  # mode="elements" / single
"""html"""
# raw_documents = UnstructuredHTMLLoader('/Users/2dqy004/Downloads/21.html',
#                                        mode="single", ).load()  # mode="elements" / single

"""JSONLoader"""
raw_documents = JSONLoader('/Users/2dqy004/PycharmProjects/fastApiProject/test.json', jq_schema='.').load()  # mode="elements" / single






# raw_documents = whisper.load_model('/Users/2dqy004/Downloads/江南水乡.jpeg').load()

# raw_documents = UnstructuredWordDocumentLoader(
#     '/Users/2dqy004/Downloads/20250306_2nd_round_test.docx').load()  # 专门用于处理 .doc 和 .docx 文件的加载器
# 创建一个文本分割器，chunks代表分成多少块  chunk_overlap 确保相邻片段之间有一定的重叠部分
"""
RecursiveCharacterTextSplitter 是一个递归字符文本分割器，它可以将文本分割成多个片段。
它的工作原理是，首先将文本分割成多个片段，然后对每个片段进行递归分割，直到每个片段的长度都小于等于 chunk_size。
chunk_size 是一个整数，表示每个片段的最大长度。
chunk_overlap 是一个整数，表示相邻片段之间的重叠部分的长度。

CharacterTextSplitter 是一个字符文本分割器，它可以将文本分割成多个片段。

"""
text_splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=300)
# 使用文本分割器，将原始文档分割成多个片段   documents是一个列表
documents = text_splitter.split_documents(raw_documents)
print(documents)
# for i in documents:
#     print(i)
