import NetInfo from "@react-native-community/netinfo";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
export const BG_UPLOAD_TASK = "bg-upload-task"

async function flushPendingUploads(): Promise<boolean> {
  try {
    // Dynamic import with type assertion for optional module
     
    const mod = await import("../lib/upload-queue").catch(() => null) as {
      flushPendingUploads?: () => Promise<boolean>
    } | null
    if (mod && typeof mod.flushPendingUploads === 'function') {
      return (await mod.flushPendingUploads()) === true
    }
    return false
  } catch {
    return false
  }
}

TaskManager.defineTask(BG_UPLOAD_TASK, async (): Promise<BackgroundFetch.BackgroundFetchResult> => {
  const net = await NetInfo.fetch()
  if (!net.isConnected) {
    return BackgroundFetch.BackgroundFetchResult.NoData
  }
  const did = await flushPendingUploads()
  return did ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData
})

export async function initBackgroundUploads(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(BG_UPLOAD_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true
    })
  } catch {
    // Task registration failed, ignore
  }
}
