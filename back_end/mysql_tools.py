import json
import logging

import pymysql

from constant import HOST, PORT, USER, PASSWORD, DATABASE
def create_connection():
    conn = pymysql.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PASSWORD,
        database=DATABASE,
    )
    return conn

# conn = create_connection()
#
# cursor = conn.cursor()
# cursor.execute("select * from Users")
# id_list = []
# for i in cursor.fetchall():
#     id_list.append(i[0])
#
# conn.close()
# print(id_list)

def create_db():
    connection = pymysql.connect(host=HOST,
                                 user=USER,
                                 port=PORT,
                                 password=PASSWORD,
                                 database=DATABASE,
                                 charset='utf8mb4', )
    cursor = connection.cursor()
    return cursor


def insert_context(user_id, chatbot_id, context):
    conn = create_connection()
    cursor = conn.cursor()
    try:
        # 将字符串转换为字典
        # context = json.loads(context)
        logging.info(f"{user_id}{chatbot_id}{context}")

        # 插入数据
        cursor.execute("""
            INSERT INTO context (user_id, chatbot_id, context) 
            VALUES (%s, %s, %s)
            """, (user_id, chatbot_id, context))  # 使用 json.dumps 将字典转换为字符串存储
        cursor.connection.commit()  # 提交事务
        cursor.close()

        return {'status': True}
    except Exception as e:
        print(f"发生错误：{e}")
        return {'status': False, 'message': str(e)}
    finally:
        cursor.close()


# print(insert_context(1, 1, '{"role": "user", "content": "你好"}'))


def get_context(user_id, chatbot_id):
    cursor = create_db()
    cursor.execute("SELECT * FROM context WHERE user_id = %s AND chatbot_id = %s ORDER BY time DESC LIMIT 10",
                   (user_id, chatbot_id))
    history = cursor.fetchall()
    context_history = []
    for i in history:
        context_history.append(eval(i[3]))
    return context_history

# print(get_context(1,1))

