import argparse
import logging
from .config import Settings


def main():
    parser = argparse.ArgumentParser(description="EDUS private study worker")
    parser.add_argument("command", choices=("serve", "work"))
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    settings = Settings.from_env()
    from .embeddings import Embedder
    if args.command == "serve":
        settings.require_server()
        from .server import serve
        serve(settings, Embedder(settings))
    else:
        settings.require_worker()
        from .db import Database
        from .storage import Storage
        from .vision import Vision
        from .extraction import Extractor
        from .worker import Worker
        database = Database(settings)
        Worker(settings, database, Storage(settings), Extractor(Vision(settings, database)),
               Embedder(settings)).run()


if __name__ == "__main__":
    main()
