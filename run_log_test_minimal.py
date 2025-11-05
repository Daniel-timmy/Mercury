import logging
from logging.handlers import RotatingFileHandler
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGS_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOGS_DIR, exist_ok=True)
logfile = os.path.join(LOGS_DIR, 'trip_planner.log')

formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s')
handler = RotatingFileHandler(logfile, maxBytes=1024*1024*1, backupCount=2, encoding='utf-8')
handler.setFormatter(formatter)

logger = logging.getLogger('core')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)

logger.info('Minimal test log entry')
print('Wrote minimal test log entry to', logfile)
