import MessageInput from '@/components/message-input';
import MessageItem from '@/components/message-item';
import { useClickDrawer } from '@/components/pdf-drawer/hooks';
import { MessageType, SharedFrom } from '@/constants/chat';
import { useSendButtonDisabled } from '@/pages/chat/hooks';
import { Flex, Spin } from 'antd';
import React, {forwardRef, useEffect, useMemo, useRef} from 'react';
import {
  useGetSharedChatSearchParams,
  useSendSharedMessage,
} from '../shared-hooks';
import { buildMessageItemReference } from '../utils';

import PdfDrawer from '@/components/pdf-drawer';
import { useFetchNextConversationSSE } from '@/hooks/chat-hooks';
import { useFetchFlowSSE } from '@/hooks/flow-hooks';
import i18n from '@/locales/config';
import { buildMessageUuidWithRole } from '@/utils/chat';
import styles from './index.less';

const ChatContainer = () => {
  const {
    sharedId: conversationId,
    from,
    locale,
    visibleAvatar,
  } = useGetSharedChatSearchParams();
  const { visible, hideModal, documentId, selectedChunk, clickDocumentButton } =
    useClickDrawer();

  const {
    handlePressEnter,
    handleInputChange,
    value,
    sendLoading,
    loading,
    ref,
    derivedMessages,
    hasError,
  } = useSendSharedMessage();
  const sendDisabled = useSendButtonDisabled(value);

  const useFetchAvatar = useMemo(() => {
    return from === SharedFrom.Agent
      ? useFetchFlowSSE
      : useFetchNextConversationSSE;
  }, [from]);
  React.useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, visibleAvatar]);
  const { data: avatarData } = useFetchAvatar();

  if (!conversationId) {
    return <div>empty</div>;
  }


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
                    visibleAvatar={visibleAvatar}
                    key={buildMessageUuidWithRole(message)}
                    avatarDialog={avatarData?.avatar}
                    item={message}
                    nickname="You"
                    reference={buildMessageItemReference(
                      {
                        message: derivedMessages,
                        reference: [],
                      },
                      message,
                    )}
                    loading={
                      message.role === MessageType.Assistant &&
                      sendLoading &&
                      derivedMessages?.length - 1 === i
                    }
                    index={i}
                    clickDocumentButton={clickDocumentButton}
                    showLikeButton={false}
                    showLoudspeaker={false}
                  ></MessageItem>
                );
              })}
            </Spin>
          </div>
          <div ref={ref} />

        </Flex>

        <MessageInput
          isShared
          value={value}
          disabled={hasError}
          sendDisabled={sendDisabled}
          conversationId={conversationId}
          onInputChange={handleInputChange}
          onPressEnter={handlePressEnter}
          sendLoading={sendLoading}
          uploadMethod="external_upload_and_parse"
          showUploadIcon={false}

          inputRef={inputRef}
          buttonRef={buttonRef}
        ></MessageInput>
      </Flex>
      {visible && (
        <PdfDrawer
          visible={visible}
          hideModal={hideModal}
          documentId={documentId}
          chunk={selectedChunk}
        ></PdfDrawer>
      )}
    </>
  );
};

export default forwardRef(ChatContainer);
