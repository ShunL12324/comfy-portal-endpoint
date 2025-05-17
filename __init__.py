import os
from .logger import get_logger
from .api import workflow

logger = get_logger()

# set web directory
WEB_DIRECTORY = "js"

# Since we don't have any nodes, these will be empty
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']