import json
import logging

import pymysql

from constant import HOST, PORT, USER, PASSWORD, DATABASE

"创建一个数据库连接对象"


class DataBaseManage:
    def create_connection(self):
        conn = pymysql.connect(
            host=HOST,
            port=PORT,
            user=USER,
            password=PASSWORD,
            database=DATABASE,
        )
        return conn

    """插入上下文"""

    def insert_context(self, user_id, chatbot_id, query, answer):
        conn = self.create_connection()
        cursor = conn.cursor()
        try:
            # 将字符串转换为字典
            # context = json.loads(context)
            logging.info(f"{user_id}{chatbot_id}{query}{answer}")

            # 插入数据
            cursor.execute("""
                INSERT INTO context (user_id, chatbot_id, query, answer) 
                VALUES (%s, %s, %s, %s)
                """, (user_id, chatbot_id, query,answer))  # 使用 json.dumps 将字典转换为字符串存储
            cursor.connection.commit()  # 提交事务
            cursor.close()

            return {'status': True}
        except Exception as e:
            print(f"发生错误：{e}")
            return {'status': False, 'message': str(e)}
        finally:
            cursor.close()

    """获取近10条对话上下文"""

    def get_context(self, user_id, chatbot_id):
        conn = self.create_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT query,answer FROM context WHERE user_id = %s AND chatbot_id = %s ORDER BY time DESC LIMIT 10",
            (user_id, chatbot_id))
        history = cursor.fetchall()
        context_history = []
        for i in history:
            context_history.append(eval(i[0]))  # 将字符串转成字典
            context_history.append(eval(i[1]))  # 将字符串转成字典
        logging.info(f"数据库返回的结果{context_history}")
        return context_history

    """获取用户对话历史记录"""

    def get_history(self, user_id, chatbot_id):
        conn = self.create_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM context WHERE user_id = %s AND chatbot_id = %s ORDER BY time DESC",
                       (user_id, chatbot_id))
        history = cursor.fetchall()
        context_history = []
        for i in history:
            context_history.append(eval(i[3]))  # 将字符串转成字典
        return context_history

    """获取用户有多少个chatbot"""

    def get_chatbot_from_user(self, user_id):
        conn = self.create_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT chatbot_id FROM context where user_id = %s", user_id)
        chatbots_list = cursor.fetchall()
        chatbot = []
        for i in chatbots_list:
            chatbot.append(i[0])
        chatbot = list(set(chatbot))
        logging.info(f"chatbot_id: {chatbot}")
        return chatbot

    """创建一个新的chatbot"""
    def create_chatbot(self, user_id, name, description, prompt):
        conn = self.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO chatbots (user_id, name, description, prompt)
                VALUES (%s, %s, %s, %s)
                """, (user_id, name, description, prompt))
            cursor.connection.commit()  # 提交事务
            """写入后，需要获取chatbot_id，然后根据user_id和chatbot_id生成colloction_name"""
            cursor.execute("SELECT id FROM chatbots WHERE user_id = %s AND name = %s", (user_id, name))
            cursor


            cursor.close()
            conn.close()
        except Exception as e:
            print(f"发生错误：{e}")
    """更新chatbot"""
    def update_chatbot(self, user_id, name, description, prompt):
        conn = self.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                        update chatbots set name = %s, description = %s, prompt = %s
                        where user_id = %s
                        """, (name, description, prompt, user_id,))
            cursor.connection.commit()  # 提交事务
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"发生错误：{e}")