import json
import logging

import pymysql

from constant import HOST, PORT, USER, PASSWORD, DATABASE

"创建一个数据库连接对象"


class DataBaseManage:
    """创建数据库连接"""
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
                """, (user_id, chatbot_id, query, answer))  # 使用 json.dumps 将字典转换为字符串存储
            conn.commit()  # 提交事务
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
            # 先检查用户已有的chatbot数量
            cursor.execute("SELECT COUNT(*) FROM chatbots WHERE user_id = %s", (user_id,))
            count = cursor.fetchone()[0]
            if count >= 5:
                return {'status': 200, "message": "创建agent失败，每个用户最多创建5个agent"}
        
            # 再执行INSERT操作
            cursor.execute("""
                INSERT INTO chatbots (user_id, name, description, prompt)
                VALUES (%s, %s, %s, %s)
                """, (user_id, name, description, prompt))
            
            # 精确查询刚插入的记录
            cursor.execute("""
                SELECT id FROM chatbots 
                WHERE user_id = %s AND name = %s 
                ORDER BY id DESC LIMIT 1
                """, (user_id, name))
            chatbot_id = cursor.fetchone()[0]
            
            # 生成并更新collection_name
            collection_name = f"{user_id}_{chatbot_id}"

            cursor.execute("""
                UPDATE chatbots SET collection_name = %s
                WHERE id = %s 
                """, (collection_name, chatbot_id))
                
            conn.commit()
            return {'status': 200, "user_id": user_id, 'chatbot_id': chatbot_id, "collection_name": collection_name}
        except Exception as e:
            conn.rollback()
            return {'status': 200, "message": f"创建agent失败，原因:{e}"}
        finally:
            cursor.close()
            conn.close()

    """更新chatbot"""

    def update_chatbot(self, id, name, description, prompt):
        conn = self.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                        update chatbots set name = %s, description = %s, prompt = %s
                        where id = %s
                        """, (name, description, prompt, id,))
            conn.commit()  # 提交事务
            cursor.close()
            conn.close()
            return {'status': 200, "message": "更新成功"}

        except Exception as e:
            print(f"发生错误：{e}")
            return {'status': 200, "message": f"创建agent失败，原因:{e}"}

    """通过chatbot_id获取collection_name"""
    def get_col_name_by_chatbot_id(self,chatbot_id):
        conn = self.create_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                                SELECT collection_name FROM chatbots WHERE id = %s
                                """, (chatbot_id))
            conn.commit()  # 提交事务
            res = cursor.fetchall()
            cursor.close()
            conn.close()
            return {'status': 200, "message": "更新成功", "data": res[0][0]}

        except Exception as e:
            print(f"发生错误：{e}")
            return {'status': 200, "message": f"获取collection_name失败，原因:{e}"}


