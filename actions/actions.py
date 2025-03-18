# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions


# This is a simple example for a custom action which utters "Hello World!"

# from typing import Any, Text, Dict, List
#
# from rasa_sdk import Action, Tracker
# from rasa_sdk.executor import CollectingDispatcher
#
#
# class ActionHelloWorld(Action):
#
#     def name(self) -> Text:
#         return "action_hello_world"
#
#     def run(self, dispatcher: CollectingDispatcher,
#             tracker: Tracker,
#             domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
#
#         dispatcher.utter_message(text="Hello World!")
#
#         return []


# from typing import Any, Text, Dict, List
# from rasa_sdk import Action, Tracker
# from rasa_sdk.executor import CollectingDispatcher
# import openai
# import os

# # Configure sua chave de API do OpenAI
# # É melhor usar variáveis de ambiente para isso
# # Para testes, você pode definir diretamente aqui, mas lembre-se de não compartilhar este código com sua chave
# # openai.api_key = "sua-chave-api-aqui"
# # Para definir como variável de ambiente no CMD:
# # set OPENAI_API_KEY=sua-chave-api-aqui

# class ActionPerguntarChatGPT(Action):
#     def name(self) -> Text:
#         return "action_perguntar_chatgpt"

#     def run(self, dispatcher: CollectingDispatcher,
#             tracker: Tracker,
#             domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
#         # Tenta obter a chave API da variável de ambiente
#         api_key = os.getenv("OPENAI_API_KEY")
        
#         if not api_key:
#             dispatcher.utter_message(text="Desculpe, não consigo acessar o ChatGPT porque a chave API não está configurada.")
#             return []
        
#         openai.api_key = api_key
        
#         # Obtém o tema da pergunta, se foi fornecido
#         tema = next(tracker.get_latest_entity_values("tema"), None)
        
#         # Se não houver tema específico, usa a última mensagem do usuário
#         if not tema:
#             tema = tracker.latest_message.get("text", "")
        
#         try:
#             # Prepara a pergunta para o ChatGPT
#             mensagem = f"Responda de forma concisa, em português brasileiro: {tema}"
            
#             # Chama a API do ChatGPT
#             resposta = openai.ChatCompletion.create(
#                 model="gpt-3.5-turbo",  # Você pode mudar para outro modelo se preferir
#                 messages=[
#                     {"role": "system", "content": "Você é um assistente virtual útil que responde em português brasileiro."},
#                     {"role": "user", "content": mensagem}
#                 ],
#                 max_tokens=500  # Limite o tamanho da resposta
#             )
            
#             # Extrai e envia a resposta
#             texto_resposta = resposta.choices[0].message['content'].strip()
#             dispatcher.utter_message(text=texto_resposta)
            
#         except Exception as e:
#             dispatcher.utter_message(text=f"Desculpe, tive um problema ao consultar o ChatGPT: {str(e)}")
        
#         return []



# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions

from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import requests
import re
import json
import os
from openai import OpenAI

# Esta classe mantém a compatibilidade com o código existente para consultar o OpenAI ChatGPT
class ActionAskGPT(Action):
    def name(self) -> Text:
        return "action_perguntar_chatgpt"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtém a mensagem do usuário
        mensagem_usuario = tracker.latest_message.get('text', '')
        
        # Extrai a pergunta após o prefixo "gpt:"
        padrao = r'(?:gpt:|pergunte ao gpt:|consulte o chatgpt sobre|use o gpt para)(.*)'
        resultado = re.search(padrao, mensagem_usuario, re.IGNORECASE)
        
        if resultado:
            pergunta = resultado.group(1).strip()
        else:
            # Tenta extrair o tema da entidade
            tema = next(tracker.get_latest_entity_values("tema"), None)
            pergunta = tema if tema else mensagem_usuario.strip()
        
        if not pergunta:
            dispatcher.utter_message(text="Por favor, faça uma pergunta após o prefixo 'gpt:'.")
            return []
        
        try:
            # Inicializa o cliente OpenAI com a chave API
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                dispatcher.utter_message(text="Chave API do OpenAI não configurada. Configure a variável de ambiente OPENAI_API_KEY ou use o comando 'ollama:' para consultar a IA local.")
                return []
            
            client = OpenAI(api_key=api_key)
            
            # Faz a chamada para a API do OpenAI
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Você é um assistente útil que responde em português do Brasil."},
                    {"role": "user", "content": pergunta}
                ]
            )
            
            # Extrai a resposta do modelo
            resposta_chatgpt = completion.choices[0].message.content
            
            # Envia a resposta para o usuário
            dispatcher.utter_message(text=f"ChatGPT: {resposta_chatgpt}")
            
        except Exception as e:
            dispatcher.utter_message(text=f"Desculpe, ocorreu um erro ao consultar o ChatGPT: {str(e)}. Talvez queira tentar usar 'ollama:' para usar a IA local.")
            
            # Informações de depuração adicionais
            import traceback
            print(f"Erro ao chamar a API OpenAI: {str(e)}")
            print(traceback.format_exc())
        
        return []


# Esta é a nova classe para consultar o Ollama localmente
class ActionAskOllama(Action):
    def name(self) -> Text:
        return "action_ask_ollama"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtém a mensagem do usuário
        mensagem_usuario = tracker.latest_message.get('text', '')
        
        # Extrai a pergunta após prefixos comuns
        padrao = r'(?:ollama:|pergunte ao ollama:|consulte o ollama sobre|use o ollama para|ia:)(.*)'
        resultado = re.search(padrao, mensagem_usuario, re.IGNORECASE)
        
        if resultado:
            pergunta = resultado.group(1).strip()
        else:
            # Tenta extrair o tema da entidade
            tema = next(tracker.get_latest_entity_values("tema"), None)
            pergunta = tema if tema else mensagem_usuario.strip()
        
        if not pergunta:
            dispatcher.utter_message(text="Por favor, faça uma pergunta para o Ollama.")
            return []
        
        try:
            # URL da API local do Ollama (padrão é localhost:11434)
            url = "http://localhost:11434/api/chat"
            
            # Define o modelo - experimente diferentes modelos conforme disponíveis no seu sistema
            # Para listar os modelos disponíveis, execute 'ollama list' no terminal
            modelo = "llama2"  # Substitua pelo modelo que você baixou
            
            # Informa ao usuário que está processando
            dispatcher.utter_message(text="Processando sua pergunta com o Ollama...")
            
            # Prepara os dados para enviar ao Ollama
            payload = {
                "model": modelo,
                "messages": [
                    {"role": "system", "content": "Você é um assistente útil que responde em português do Brasil. Mantenha suas respostas concisas e diretas."},
                    {"role": "user", "content": pergunta}
                ],
                "stream": False
            }
            
            # Faz a chamada para a API local do Ollama
            resposta = requests.post(url, json=payload)
            
            # Verifica se a chamada foi bem-sucedida
            if resposta.status_code == 200:
                # Extrai a resposta do modelo
                dados_resposta = resposta.json()
                resposta_ollama = dados_resposta["message"]["content"]
                
                # Envia a resposta para o usuário
                dispatcher.utter_message(text=f"Assistente IA: {resposta_ollama}")
            else:
                dispatcher.utter_message(text=f"Erro ao conectar ao Ollama. Código: {resposta.status_code}. Verifique se o Ollama está instalado e em execução.")
                print(f"Erro na API do Ollama: {resposta.text}")
            
        except Exception as e:
            dispatcher.utter_message(text=f"Desculpe, ocorreu um erro ao consultar o Ollama: {str(e)}. Verifique se o Ollama está instalado e em execução.")
            
            # Informações de depuração
            import traceback
            print(f"Erro ao chamar a API Ollama: {str(e)}")
            print(traceback.format_exc())
        
        return []