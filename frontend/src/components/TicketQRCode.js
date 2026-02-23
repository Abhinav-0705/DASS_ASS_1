import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { COLORS } from '../constants/theme';

const TicketQRCode = ({ ticketId, eventName, participantName }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (ticketId && canvasRef.current) {
      generateQRCode();
    }
  }, [ticketId]);

  const generateQRCode = async () => {
    try {
      // Generate QR code with ticket ID
      await QRCode.toCanvas(canvasRef.current, ticketId, {
        width: 200,
        margin: 2,
        color: {
          dark: COLORS.primary,
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const downloadQR = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ticket-${ticketId}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div style={{
      background: COLORS.white,
      padding: '24px',
      borderRadius: '12px',
      border: `2px solid ${COLORS.secondary}`,
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        color: COLORS.primary, 
        fontSize: '20px',
        fontWeight: '600'
      }}>
        🎫 Your Ticket
      </h3>
      
      <div style={{
        background: COLORS.veryLightGray,
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <canvas ref={canvasRef} />
      </div>

      <div style={{
        background: `${COLORS.primary}10`,
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '12px'
      }}>
        <div style={{ 
          fontSize: '12px', 
          color: COLORS.darkGray, 
          marginBottom: '4px',
          fontWeight: '500'
        }}>
          Ticket ID
        </div>
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          color: COLORS.primary,
          fontFamily: 'monospace',
          letterSpacing: '1px'
        }}>
          {ticketId}
        </div>
      </div>

      {eventName && (
        <div style={{ 
          fontSize: '14px', 
          color: COLORS.darkGray, 
          marginBottom: '4px' 
        }}>
          <strong>Event:</strong> {eventName}
        </div>
      )}

      {participantName && (
        <div style={{ 
          fontSize: '14px', 
          color: COLORS.darkGray, 
          marginBottom: '16px' 
        }}>
          <strong>Participant:</strong> {participantName}
        </div>
      )}

      <button
        onClick={downloadQR}
        style={{
          padding: '10px 20px',
          background: COLORS.secondary,
          color: COLORS.white,
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => e.target.style.opacity = '0.9'}
        onMouseOut={(e) => e.target.style.opacity = '1'}
      >
        📥 Download QR Code
      </button>

      <div style={{
        fontSize: '12px',
        color: COLORS.darkGray,
        marginTop: '12px',
        fontStyle: 'italic'
      }}>
        Show this QR code at the event venue for check-in
      </div>
    </div>
  );
};

export default TicketQRCode;
