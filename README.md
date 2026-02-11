# Dev Logs

## Description

This tool generates daily commit reports and sends them to Discord or whatever you want.

## Installation

```bash
npm link
```

## Usage

```bash
devlogs
```

## Run all projects

```bash
./run-all-projects.sh
```

## Cron Jobs

Run every day at 6:00 PM

```bash
crontab -e
```

Add the following line:

```bash
0 18 * * 1-5 /Users/<username>/tools/devlogs/run-all-projects.sh >> /tmp/cron_devlogs.txt 2>&1
```