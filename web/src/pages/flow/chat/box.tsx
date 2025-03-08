import MessageItem from '@/components/message-item';
import { MessageType } from '@/constants/chat';
import { useGetFileIcon } from '@/pages/chat/hooks';
import { buildMessageItemReference } from '@/pages/chat/utils';
import { Flex, Spin } from 'antd';

import { useSendNextMessage } from './hooks';

import MessageInput from '@/components/message-input';
import PdfDrawer from '@/components/pdf-drawer';
import { useClickDrawer } from '@/components/pdf-drawer/hooks';
import { useFetchFlow } from '@/hooks/flow-hooks';
import { useFetchUserInfo } from '@/hooks/user-setting-hooks';
import { buildMessageUuidWithRole } from '@/utils/chat';
import styles from './index.less';
import {useEffect, useRef} from "react";

const FlowChatBox = () => {
  const {
    sendLoading,
    handleInputChange,
    handlePressEnter,
    value,
    loading,
    ref,
    derivedMessages,
    reference,
  } = useSendNextMessage();

  const { visible, hideModal, documentId, selectedChunk, clickDocumentButton } =
    useClickDrawer();
  useGetFileIcon();
  const { data: userInfo } = useFetchUserInfo();
  const { data: canvasInfo } = useFetchFlow();




  const inputRef = useRef<any>(null); // Référence pour l'élément Input
  const buttonRef = useRef<HTMLButtonElement>(null); // Référence pour le bouton d'envoi

  const handleButtonClick = (param: string) => {


    if (inputRef.current) {
      // Accéder à l'élément input natif
      const nativeInput = inputRef.current.input;

      // Créer un événement `input`
      const event = new Event('input', { bubbles: true });

      // Utiliser la fonction `onInputChange` de React
      handleInputChange({ target: { value: param } } as any);

      // Déclencher `handlePressEnter` après un petit délai
      setTimeout(() => {
        buttonRef.current.click();
        // handlePressEnter();
      }, 300);
    }
  };

  useEffect(() => {
    const handleClick = (event: Event) => {
      const button = event.target as HTMLElement;
      const param = button.getAttribute('data-param');

      if (param) {
        handleButtonClick(param);
      }
    };

    const observeButtons = () => {
      const buttons = document.querySelectorAll('[data-param]');
      buttons.forEach((button) => {
        button.removeEventListener('click', handleClick); // Nettoyer au cas où
        button.addEventListener('click', handleClick);
      });
    };

    // Observer les changements dans le DOM
    const observer = new MutationObserver(() => {
      observeButtons();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Ajouter les événements initiaux
    observeButtons();

    return () => {
      observer.disconnect(); // Arrêter l'observation
      document.querySelectorAll('[data-param]').forEach((button) => {
        button.removeEventListener('click', handleClick);
      });
    };
  }, []);




  return (
    <>
      <Flex flex={1} className={styles.chatContainer} vertical>
        <Flex flex={1} vertical className={styles.messageContainer}>
          <div>
            <Spin spinning={loading}>
              {derivedMessages?.map((message, i) => {
                return (
                  <MessageItem
                    loading={
                      message.role === MessageType.Assistant &&
                      sendLoading &&
                      derivedMessages.length - 1 === i
                    }
                    key={buildMessageUuidWithRole(message)}
                    nickname={userInfo.nickname}
                    avatar={userInfo.avatar}
                    avatarDialog={canvasInfo.avatar}
                    item={message}
                    reference={buildMessageItemReference(
                      { message: derivedMessages, reference },
                      message,
                    )}
                    clickDocumentButton={clickDocumentButton}
                    index={i}
                    showLikeButton={false}
                    sendLoading={sendLoading}
                  ></MessageItem>
                );
              })}
            </Spin>
          </div>
          <div ref={ref} />
        </Flex>
        <MessageInput
          showUploadIcon={false}
          value={value}
          sendLoading={sendLoading}
          disabled={false}
          sendDisabled={sendLoading}
          conversationId=""
          onPressEnter={handlePressEnter}
          onInputChange={handleInputChange}

          inputRef={inputRef}
          buttonRef={buttonRef}
        />
      </Flex>
      <PdfDrawer
        visible={visible}
        hideModal={hideModal}
        documentId={documentId}
        chunk={selectedChunk}
      ></PdfDrawer>
    </>
  );
};

export default FlowChatBox;
