from .base import *

DEBUG = True

INSTALLED_APPS += [
    "schema_viewer",
    "debug_toolbar",
    "django_migration_linter",
    "corsheaders",
    # "explorer",
]

MIDDLEWARE += [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "debug_toolbar.middleware.DebugToolbarMiddleware",
]


def show_toolbar_to_all_IPs(request):
    return True


# CORS settings to enable API calls for Vue.js while development
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5174",
]

DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": show_toolbar_to_all_IPs,
}

MIGRATION_LINTER_OPTIONS = {
    "no_cache": True,
}

READONLY_DATABASE_URL = os.environ.get(
    "READONLY_DATABASE_URL", "sqlite:////usr/src/db.sqlite"
)

DATABASES["readonly"] = dj_database_url.config(
    default=dj_database_url.parse(READONLY_DATABASE_URL),
    conn_max_age=1800,
    conn_health_checks=True,
)

EXPLORER_CONNECTIONS = {"Default": "readonly"}
EXPLORER_DEFAULT_CONNECTION = "readonly"

EXPLORER_ASSISTANT_MODEL = {
    "name": "meta-llama/llama-3.1-8b-instruct:free",
    "max_tokens": 131072,
}

EXPLORER_ASSISTANT_BASE_URL = "https://openrouter.ai/api/v1"
EXPLORER_AI_API_KEY = os.environ.get("OPENROUTER_API_KEY", "aaaaaaaaaaaaaaa")

LOGGING["handlers"] = LOGGING["handlers"] | {
    "rich_console": {
        "class": "rich.logging.RichHandler",
        "formatter": "rich",
        "level": "DEBUG",
        "rich_tracebacks": True,
        "tracebacks_show_locals": True,
    },
}

LOGGING["loggers"] = {
    "django.request": {
        "handlers": ["rich_console"],
        "level": "ERROR",
        "propagate": True,
    },
    "django": {
        "handlers": ["rich_console", "logfile"],
        "propagate": False,
    },
    "django.db.backends": {
        "handlers": ["rich_console"],
        "propagate": False,
    },
    "db": {
        "handlers": ["rich_console"],
    },
}

DEBUG_TOOLBAR_PANELS = [
    'debug_toolbar.panels.history.HistoryPanel',
    'debug_toolbar.panels.versions.VersionsPanel',
    'debug_toolbar.panels.timer.TimerPanel',
    'debug_toolbar.panels.settings.SettingsPanel',
    'debug_toolbar.panels.headers.HeadersPanel',
    'debug_toolbar.panels.request.RequestPanel',
    'debug_toolbar.panels.sql.SQLPanel',
    'debug_toolbar.panels.templates.TemplatesPanel',
    'debug_toolbar.panels.cache.CachePanel',
    'debug_toolbar.panels.signals.SignalsPanel',
    'debug_toolbar.panels.redirects.RedirectsPanel',
    'debug_toolbar.panels.profiling.ProfilingPanel',
]