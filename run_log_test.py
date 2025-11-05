import logging
import logging.config

# Import the Django settings module from the project
from trip_planner.trip_planner import settings

# Configure logging from settings.LOGGING
logging.config.dictConfig(settings.LOGGING)

logger = logging.getLogger('core')
logger.info('Test log entry from run_log_test')
print('Logged test message to logs/trip_planner.log')
