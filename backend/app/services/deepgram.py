import asyncio
import logging
import os
from typing import Dict, Any, Optional, List
from deepgram import DeepgramClient, PrerecordedOptions
from app.config.settings import settings
from deepgram import LiveOptions
import websockets
import json

logger = logging.getLogger(__name__)

class DeepgramService:
    def __init__(self):
        self.api_key = settings.deepgram_api_key or os.getenv("DEEPGRAM_API_KEY")
        if not self.api_key:
            logger.warning("DEEPGRAM_API_KEY not found in environment variables or settings")
            self.client = None
        else:
            self.client = DeepgramClient(self.api_key)
            self.live_client = self.client.listen.asyncwebsocket.v("1")
    
    def is_available(self) -> bool:
        """Check if Deepgram service is available"""
        return self.client is not None and self.api_key is not None
    
    async def transcribe_audio_file(self, audio_file_path: str, language: str = "en") -> Dict[str, Any]:
        if not self.is_available():
            raise RuntimeError("Deepgram service is not available")
        try:
            with open(audio_file_path, 'rb') as audio:
                options = PrerecordedOptions(
                    model="nova-2",
                    language=language,
                    smart_format=True,
                    punctuate=True,
                    diarize=True,
                    utterances=True
                )
                response = await self.client.transcription.prerecorded(audio, options)
                return self._parse_response(response, language)
        except Exception as e:
            logger.error(f"Deepgram transcription error: {e}")
            return self._error_response(str(e))

    async def transcribe_audio_data(self, audio_data: bytes, language: str = "en") -> Dict[str, Any]:
        if not self.is_available():
            raise RuntimeError("Deepgram service is not available")
        try:
            import io
            audio = io.BytesIO(audio_data)
            options = PrerecordedOptions(
                model="nova-2",
                language=language,
                smart_format=True,
                punctuate=True,
                diarize=True,
                utterances=True
            )
            response = await self.client.transcription.prerecorded(audio, options)
            return self._parse_response(response, language)
        except Exception as e:
            logger.error(f"Deepgram transcription error: {e}")
            return self._error_response(str(e))

    async def detect_language(self, audio_data: bytes) -> Dict[str, Any]:
        if not self.is_available():
            raise RuntimeError("Deepgram service is not available")
        try:
            import io
            audio = io.BytesIO(audio_data)
            options = PrerecordedOptions(
                model="nova-2",
                smart_format=True,
                punctuate=True,
                diarize=True,
                utterances=True
            )
            response = await self.client.transcription.prerecorded(audio, options)
            # Language detection is in response['metadata']['language']
            detected_language = response['metadata'].get('language', 'en')
            confidence = response['metadata'].get('confidence', 0.0)
            return {
                "success": True,
                "detected_language": detected_language,
                "confidence": confidence,
                "is_reliable": confidence > 0.8
            }
        except Exception as e:
            logger.error(f"Deepgram language detection error: {e}")
            return {
                "success": False,
                "error": str(e),
                "detected_language": "en",
                "confidence": 0.0,
                "is_reliable": False
            }

    def _parse_response(self, response, language: str) -> Dict[str, Any]:
        try:
            # Deepgram v3+ response structure
            results = response['results']
            if results and results['channels']:
                alt = results['channels'][0]['alternatives'][0]
                words = alt.get('words', [])
                return {
                    "success": True,
                    "transcript": alt.get('transcript', ''),
                    "confidence": alt.get('confidence', 1.0),
                    "words": [
                        {
                            "word": w.get('word'),
                            "start": w.get('start'),
                            "end": w.get('end'),
                            "confidence": w.get('confidence')
                        } for w in words
                    ],
                    "language": language,
                    "detected_language": response['metadata'].get('language', language),
                    "detection_confidence": response['metadata'].get('confidence', 0.0)
                }
            else:
                return self._error_response("No transcription results")
        except Exception as e:
            return self._error_response(f"Parse error: {e}")

    def _error_response(self, error: str) -> Dict[str, Any]:
        return {
            "success": False,
            "error": error,
            "transcript": "",
            "confidence": 0.0
        }

    def get_supported_languages(self) -> List[Dict[str, str]]:
        return [
            {"code": "en", "name": "English"},
            {"code": "es", "name": "Spanish"},
            {"code": "fr", "name": "French"},
            {"code": "de", "name": "German"},
            {"code": "it", "name": "Italian"},
            {"code": "pt", "name": "Portuguese"},
            {"code": "ru", "name": "Russian"},
            {"code": "zh", "name": "Chinese"},
            {"code": "ja", "name": "Japanese"},
            {"code": "ko", "name": "Korean"},
            {"code": "ar", "name": "Arabic"},
            {"code": "hi", "name": "Hindi"},
            {"code": "nl", "name": "Dutch"},
            {"code": "sv", "name": "Swedish"},
            {"code": "no", "name": "Norwegian"},
            {"code": "da", "name": "Danish"},
            {"code": "fi", "name": "Finnish"},
            {"code": "pl", "name": "Polish"},
            {"code": "tr", "name": "Turkish"},
            {"code": "he", "name": "Hebrew"},
            {"code": "th", "name": "Thai"},
            {"code": "vi", "name": "Vietnamese"},
            {"code": "id", "name": "Indonesian"},
            {"code": "ms", "name": "Malay"},
            {"code": "fa", "name": "Persian"}
        ]

    async def transcribe_live_audio_stream(self, audio_stream_generator, language: str = "en"):
        if not self.is_available():
            raise RuntimeError("Deepgram service is not available")
        # Build the Deepgram WebSocket URL with query params
        url = (
            f"wss://api.deepgram.com/v1/listen"
            f"?model=nova-2"
            f"&language={language}"
            f"&smart_format=true"
            f"&punctuate=true"
            f"&interim_results=true"
            f"&diarize=true"
            f"&encoding=linear16"
            f"&sample_rate=44100"
        )
        headers = {
            "Authorization": f"Token {self.api_key}"
        }
        async with websockets.connect(url, extra_headers=headers) as ws:
            async def sender():
                async for chunk in audio_stream_generator:
                    await ws.send(chunk)
                await ws.send(b"")  # Send empty bytes to signal end of stream

            sender_task = asyncio.create_task(sender())
            async for message in ws:
                print(f"Received message from Deepgram: {message}")
                try:
                    data = json.loads(message)
                    # Only yield results with transcript
                    if (
                        data.get("channel")
                        and data["channel"].get("alternatives")
                        and data["channel"]["alternatives"][0].get("transcript")
                    ):
                        print(f"Sending transcript: {data}")
                        yield data
                except Exception as e:
                    print(f"Error parsing Deepgram message: {e}")
                    continue
            await sender_task

# Create a singleton instance
deepgram_service = DeepgramService() 