export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: 'https://cdn-icons-png.flaticon.com/512/2645/2645897.png', // Shield icon
      badge: 'https://cdn-icons-png.flaticon.com/512/2645/2645897.png',
      ...options
    });

    notification.onclick = function() {
      window.focus();
      this.close();
    };
  }
};