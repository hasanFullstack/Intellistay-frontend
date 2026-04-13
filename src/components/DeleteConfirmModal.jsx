import React from "react";
import { Modal, Typography } from "antd";

const { Paragraph, Text } = Typography;

/**
 * Reusable delete confirmation modal.
 * Props:
 * - visible: boolean
 * - onConfirm: () => Promise|void
 * - onCancel: () => void
 * - itemName: string (used in title/description)
 * - title: optional title override
 * - description: optional description override
 * - confirmLoading: boolean
 */
const DeleteConfirmModal = ({
  visible,
  onConfirm,
  onCancel,
  itemName = "item",
  title,
  description,
  confirmLoading = false,
  okText = "Delete",
  cancelText = "Cancel",
}) => {
  return (
    <Modal
      open={visible}
      title={title || `Delete ${itemName}?`}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={okText}
      okType="danger"
      cancelText={cancelText}
      confirmLoading={confirmLoading}
      centered
      destroyOnClose
    >
      <Paragraph>
        {description || `Are you sure you want to delete ${itemName}? This action cannot be undone.`}
      </Paragraph>
      <Text type="danger">This action is irreversible.</Text>
    </Modal>
  );
};

export default DeleteConfirmModal;
