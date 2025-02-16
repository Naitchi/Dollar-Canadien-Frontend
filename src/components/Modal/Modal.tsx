import React from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  isClosable: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, isClosable, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {isClosable && (
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
