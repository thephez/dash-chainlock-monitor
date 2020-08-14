create view v_chainlock_time
as
select *, (strftime('%s', chainlockseentime) - strftime('%s', blockseentime)) AS TimeForChainLock from blocks where chainlock = 1
--order by blockseentime desc