import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [balance, setBalance] = useState(null)
  const [showBalance, setShowBalance] = useState(false)
  const [error, setError] = useState('')

  const handleCheckBalance = async () => {
    setError('')
    const token = localStorage.getItem('authToken')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const response = await fetch('http://localhost:3000/api/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setBalance(data.balance)
        setShowBalance(true)
      } else {
        setError(data.message || 'Failed to fetch balance')
        if (response.status === 401) {
          setTimeout(() => navigate('/login'), 2000)
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2>Welcome to kodBank</h2>
        {error && <div className="error">{error}</div>}
        
        {!showBalance ? (
          <button onClick={handleCheckBalance} className="btn">
            Check Balance
          </button>
        ) : (
          <div className="balance-display">
            <div className="confetti"></div>
            <div className="balance-text">
              Your balance is: ₹{parseFloat(balance).toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
