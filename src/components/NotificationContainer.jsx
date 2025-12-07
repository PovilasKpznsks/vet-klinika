import { useState, useEffect } from 'react'
import { notificationService } from '../services/notificationService'
import './NotificationContainer.css'

const NotificationContainer = () => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications)
    return unsubscribe
  }, [])

  const handleClose = (id) => {
    notificationService.remove(id)
  }

  if (notifications.length === 0) return null

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          <div className="notification-content">
            <div className="notification-icon">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="notification-message">
              {notification.message}
            </div>
            <button
              className="notification-close"
              onClick={() => handleClose(notification.id)}
              aria-label="Uždaryti pranešimą"
            >
              ×
            </button>
          </div>
          {notification.autoClose && (
            <div
              className="notification-progress"
              style={{
                animationDuration: `${notification.duration}ms`
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
      return 'ℹ'
    default:
      return '•'
  }
}

export default NotificationContainer