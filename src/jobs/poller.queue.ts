import { Queue, Worker, Job } from 'bullmq';
import {connection} from '../services/redis.service';
import { pollTrackedPlayers } from '../services/LiveGame.job';
import { logger } from '../utils/logger';


export const pollerQueue = new Queue('player-poll', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

export async function startPollerQueue() {
   const repeatableJobs = await pollerQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await pollerQueue.removeRepeatableByKey(job.key);
  }

   await pollerQueue.add(
    'poll-all-players',
    {},
    {
      repeat: { every: 2 * 60 * 1000 },
    },
  );

  logger.info('Poller queue started — every 2 minutes');
}

export const pollerWorker = new Worker(
  'player-poll',
  async (job: Job) => {
    logger.info({ jobId: job.id }, 'Poll job started');
    await pollTrackedPlayers();
    logger.info({ jobId: job.id }, 'Poll job completed');
  },
  {
    connection,
    concurrency: 1, 
  },
);

 pollerWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Poll job failed');
});

pollerWorker.on('error', (err) => {
  logger.error({ err }, 'Worker error');
});
