select *, (strftime('%s', chainlockseentime) - strftime('%s', blockseentime)) AS TimeForChainLock from blocks where chainlock = 1
--order by blockseentime desc
order by TimeForChainLock desc