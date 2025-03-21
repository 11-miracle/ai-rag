import json
from datetime import datetime

import pymysql

from back_end.constant import HOST, USER, PASSWORD, DATABASE


def create_db():
    connection = pymysql.connect(host=HOST,
                                 port=3306,
                                 user=USER,
                                 password=PASSWORD,
                                 database=DATABASE,
                                 charset='utf8mb4', )
    cursor = connection.cursor()
    return cursor

def get_context():
    cursor = create_db()
    cursor.execute(f"""
    select * from context order by time DESC limit 10;
    """
    )
    history = cursor.fetchall()
    context_history = []
    for i in history:
        context_history.append(i[3])
    return context_history
def insert_context(context):
    cursor = create_db()
    try:
        # 将字符串转换为字典
        context_dict = json.loads(context)

        # 插入数据
        cursor.execute("""
            INSERT INTO context (user_id, context_id, context) 
            VALUES (%s, %s, %s)
            """, (1, 1, f'{context_dict}')) # 使用 json.dumps 将字典转换为字符串存储
        cursor.connection.commit()  # 提交事务
        print("数据插入成功！")
    except Exception as e:
        print(f"发生错误：{e}")
    finally:
        cursor.close()
        # cursor.connection.close()

print(get_context())
# insert_context('{"role": "system", "content": "以专业的天涯神贴的up主非常尖锐的语气回答问题，你是四川人，说的地道的四川话，每次回答最好要回答200字"}')