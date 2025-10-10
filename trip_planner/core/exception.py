from rest_framework.views import exception_handler as drf_exception_handler

def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return response
    # unwrap lists of length 1 into scalars
    if isinstance(response.data, dict):
        for k, v in list(response.data.items()):
            if isinstance(v, list) and len(v) == 1:
                response.data[k] = v[0]
    return response

#     # ...existing code...
# REST_FRAMEWORK = {
#     # ...existing settings...
#     "EXCEPTION_HANDLER": "trip_planner.core.exceptions.custom_exception_handler",
# }
# # ...existing code...