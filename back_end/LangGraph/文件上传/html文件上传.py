import requests
from DrissionPage import ChromiumPage, ChromiumOptions
import json
import re



# 获取网页的html代码
def spider_html(url):
    # res = requests.get(url)
    co = ChromiumOptions()
    co.incognito()  # 匿名模式
    co.headless()  # 无头模式
    co.set_argument('--no-sandbox')  # 无沙盒模式
    tab = ChromiumPage(co)
    tab.get(url)
    res = tab.html
    print(res)



# url = "https://www.baidu.com"
url = "https://www.drissionpage.cn/browser_control/get_page_info#-save"
spider_html(url)
