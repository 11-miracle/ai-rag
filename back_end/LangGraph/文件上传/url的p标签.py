# 这里可以编写代码来获取数据，例如使用 requests 库发送 HTTP 请求
import requests
from DrissionPage._configs.chromium_options import ChromiumOptions
from DrissionPage._pages.chromium_page import ChromiumPage
from lxml import etree

# url = 'https://www.gov.cn/zhengce/zhengceku/202406/content_6958188.htm'
url = 'https://www.baidu.com'
# headers = {
#     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
# }
# response = requests.get(url, headers=headers)

co = ChromiumOptions()
co.incognito()  # 匿名模式
co.headless()  # 无头模式
co.set_argument('--no-sandbox')  # 无沙盒模式
tab = ChromiumPage(co)
tab.get(url)
res = tab.html

target_tags = ["p", "span", "a", "div", "i", "td", "tr"]
# 解析HTML内容
html_tree = etree.HTML(res)
# print(response.text)
# 使用XPath筛选出所有的<p>标签
p_tags = html_tree.xpath("//p")
text = ''
# 打印所有<p>标签的内容
for p in p_tags:
    # pr
    #
    #
    # int(etree.tostring(p, encoding="unicode", pretty_print=True))
    # print(p.text)
    text += str(p.text)
print(text)