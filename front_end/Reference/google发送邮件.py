import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random

def sendMail(recv_address):
    sender_address = 'bbmy85552@gmail.com'
    sender_pass = 'srkg lpdc mgdj cxwn'  # bob's pass

    # 生成6位数字验证码
    code = random.randint(100000, 999999)
    main_content = f"您的验证码为{code}"

    message = MIMEMultipart()  # message结构体初始化
    message['From'] = sender_address  # 发件邮箱
    message['To'] = recv_address  # 收件邮箱
    message['Subject'] = 'welcome to 2dqy'
    message.attach(MIMEText(main_content, 'plain'))  # 'plain'表示文本格式

    session = smtplib.SMTP('smtp.gmail.com', 587)
    session.starttls()  # 连接tls
    session.login(sender_address, sender_pass)  # 登陆邮箱

    # message结构体内容传递给text,变量名可以自定义
    text = message.as_string()
    # 主要功能,发送邮件
    session.sendmail(sender_address, recv_address, text)
    # 打印显示发送成功
    print(f"send {code} to {recv_address}successfully".format(recv_address))
    # 关闭连接
    session.quit()

sendMail("bmy_share@163.com")
