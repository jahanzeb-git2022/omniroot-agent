"""
LLM Manager module for the Agentic Software-Development tool.
This module provides a unified interface to different LLM providers using LiteLLM.
"""
import os
from typing import Dict, Any, Optional, List
import litellm
from langchain.llms.base import LLM
from langchain.callbacks.manager import CallbackManagerForLLMRun

class LiteLLMWrapper(LLM):
    """
    Wrapper around LiteLLM models to provide a unified interface for LangChain.
    
    This class allows using any model supported by LiteLLM with LangChain's agent framework.
    """
    
    provider: str = "openai"
    model_name: str = "gpt-3.5-turbo"
    api_key: Optional[str] = None
    model_kwargs: Dict[str, Any] = {}
    
    @property
    def _llm_type(self) -> str:
        """Return the type of LLM."""
        return "litellm"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs,
    ) -> str:
        """
        Call the LiteLLM model.
        
        Args:
            prompt (str): The prompt to send to the model
            stop (List[str], optional): List of stop sequences
            run_manager (CallbackManagerForLLMRun, optional): Callback manager
            
        Returns:
            str: The model's response
        """
        # Set the API key based on provider
        if self.provider == "openai":
            os.environ["OPENAI_API_KEY"] = self.api_key or os.environ.get("OPENAI_API_KEY", "")
        elif self.provider == "anthropic":
            os.environ["ANTHROPIC_API_KEY"] = self.api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        elif self.provider == "huggingface":
            os.environ["HUGGINGFACE_API_KEY"] = self.api_key or os.environ.get("HUGGINGFACE_API_KEY", "")
        elif self.provider == "google":
            os.environ["GOOGLE_API_KEY"] = self.api_key or os.environ.get("GOOGLE_API_KEY", "")
        elif self.provider == "azure":
            os.environ["AZURE_API_KEY"] = self.api_key or os.environ.get("AZURE_API_KEY", "")
        
        # Construct the model string for LiteLLM
        model = f"{self.provider}/{self.model_name}" if self.provider != "openai" else self.model_name
        
        # Special case for Hugging Face models
        if self.provider == "huggingface":
            model = self.model_name
        
        try:
            # Call LiteLLM
            response = litellm.completion(
                model=model,
                prompt=prompt,
                stop=stop,
                **{**self.model_kwargs, **kwargs}
            )
            
            return response.choices[0].text
        except Exception as e:
            # Log the error and return a helpful message
            print(f"LiteLLM Error: {str(e)}")
            return f"Error calling LLM: {str(e)}"

def get_llm(config):
    """
    Create an LLM based on configuration.
    
    Args:
        config (dict): Configuration with provider, model_name, api_key, and model_kwargs
        
    Returns:
        LLM: A LangChain compatible LLM
    """
    return LiteLLMWrapper(
        provider=config.get("provider", "openai"),
        model_name=config.get("model_name", "gpt-3.5-turbo"),
        api_key=config.get("api_key"),
        model_kwargs=config.get("model_kwargs", {})
    )

# Default configurations for different providers
DEFAULT_CONFIGS = {
    "huggingface": {
        "provider": "huggingface",
        "model_name": "Qwen/Qwen3-235B-A22B",
        "api_key": os.environ.get("HUGGINGFACE_API_KEY", ""),
        "model_kwargs": {
            "temperature": 0.2,
            "max_length": 4096,
            "top_p": 0.9
        }
    },
    "openai": {
        "provider": "openai",
        "model_name": "gpt-3.5-turbo",
        "api_key": os.environ.get("OPENAI_API_KEY", ""),
        "model_kwargs": {
            "temperature": 0.7,
            "max_tokens": 1000,
            "top_p": 1.0
        }
    },
    "anthropic": {
        "provider": "anthropic",
        "model_name": "claude-3-opus-20240229",
        "api_key": os.environ.get("ANTHROPIC_API_KEY", ""),
        "model_kwargs": {
            "temperature": 0.5,
            "max_tokens_to_sample": 2000,
            "top_p": 0.9
        }
    },
    "google": {
        "provider": "google",
        "model_name": "gemini-pro",
        "api_key": os.environ.get("GOOGLE_API_KEY", ""),
        "model_kwargs": {
            "temperature": 0.4,
            "max_output_tokens": 1024,
            "top_p": 0.95
        }
    }
}