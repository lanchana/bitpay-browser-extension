import React, { useRef, useEffect, useState } from 'react';
import './card.scss';
import { RouteComponentProps } from 'react-router-dom';
import { Tooltip, makeStyles, createStyles } from '@material-ui/core';
import { GiftCard, CardConfig } from '../../../services/gift-card.types';
import { resizeToFitPage } from '../../../services/frame';
import { launchNewTab } from '../../../services/browser';
import { redeemGiftCard, getLatestBalance } from '../../../services/gift-card';
import LineItems from '../../components/line-items/line-items';
import CardHeader from '../../components/card-header/card-header';
import CodeBox from '../../components/code-box/code-box';
import CardMenu from '../../components/card-menu/card-menu';

const Card: React.FC<RouteComponentProps & {
  purchasedGiftCards: GiftCard[];
  updateGiftCard: (card: GiftCard) => void;
}> = ({ location, history, purchasedGiftCards, updateGiftCard }) => {
  const useStyles = makeStyles(() =>
    createStyles({
      tooltipStyles: {
        borderRadius: '6px',
        color: 'white',
        backgroundColor: '#303133',
        maxWidth: 200,
        padding: '12px 15px',
        fontWeight: 400,
        fontSize: '11px',
        textAlign: 'center',
        top: '10px'
      }
    })
  );
  const classes = useStyles();
  const ref = useRef<HTMLDivElement>(null);
  const {
    card: { invoiceId },
    cardConfig
  } = location.state as { card: GiftCard; cardConfig: CardConfig };
  const giftCard = purchasedGiftCards.find(c => c.invoiceId === invoiceId) as GiftCard;
  const [card, setCard] = useState(giftCard);
  const initiallyArchived = giftCard.archived;
  const redeemUrl = `${cardConfig.redeemUrl}${card.claimCode}`;
  const launchClaimLink = (): void => {
    const url = cardConfig.defaultClaimCodeType === 'link' ? (card.claimLink as string) : redeemUrl;
    launchNewTab(url);
  };
  const shouldShowRedeemButton = (): boolean => !!(cardConfig.redeemUrl || cardConfig.defaultClaimCodeType === 'link');
  const updateCard = async (cardToUpdate: GiftCard): Promise<void> => {
    updateGiftCard(cardToUpdate);
    setCard(cardToUpdate);
  };
  const archive = async (): Promise<void> => {
    await updateCard({ ...card, archived: true });
    initiallyArchived ? resizeToFitPage(ref, 80) : history.goBack();
  };
  const resizePageBeforeRerender = (): void => {
    const paddingBottom = shouldShowRedeemButton() ? 136 : 80;
    resizeToFitPage(ref, paddingBottom);
  };
  const unarchive = async (): Promise<void> => {
    updateGiftCard(card);
    resizePageBeforeRerender();
    updateCard({ ...card, archived: false });
  };

  const handleMenuClick = (item: string): void => {
    switch (item) {
      case 'Edit Balance':
        history.push({
          pathname: `/card/${card.invoiceId}/balance`,
          state: { card, cardConfig, updateType: 'Amount Spent' }
        });
        break;
      case 'Archive':
        archive();
        break;
      case 'Unarchive':
        unarchive();
        break;
      case 'Help':
        return launchNewTab('https://bitpay.com/request-help');
      default:
        console.log('Unknown Menu Option Selected');
    }
  };
  const redeem = async (): Promise<void> => {
    const updatedGiftCard = await redeemGiftCard(card);
    const fullCard = { ...card, ...updatedGiftCard };
    await updateCard(fullCard);
    resizeToFitPage(ref, 80);
  };
  useEffect(() => {
    resizeToFitPage(ref, 80);
  }, [ref]);
  useEffect((): void => {
    if (card.status === 'PENDING') redeem();
  }, []);
  return (
    <div className="card-details">
      <div className="card-details__content" ref={ref}>
        <CardMenu items={['Edit Balance', card.archived ? 'Unarchive' : 'Archive', 'Help']} onClick={handleMenuClick} />
        <CardHeader amount={getLatestBalance(card)} cardConfig={cardConfig} card={card} />
        <LineItems cardConfig={cardConfig} card={card} />
        {card.status === 'SUCCESS' && cardConfig.defaultClaimCodeType !== 'link' && (
          <div className="card-details__content__code-box">
            <CodeBox label="Claim Code" code={card.claimCode} />
            {card.pin && <CodeBox label="Pin" code={card.pin} />}
          </div>
        )}

        {card.status === 'SUCCESS' && !card.archived && shouldShowRedeemButton() && (
          <div className="action-button__footer">
            <button className="action-button" type="button" onClick={(): void => launchClaimLink()}>
              Redeem Now
            </button>
          </div>
        )}

        {card.status === 'PENDING' && (
          <Tooltip
            title="We’ll update your claim code here when your payment confirms"
            placement="top"
            classes={{ tooltip: classes.tooltipStyles }}
            arrow
          >
            <div className="action-button__footer">
              <button
                className="action-button action-button--warn"
                type="button"
                style={{ marginBottom: '-10px' }}
                onClick={redeem}
              >
                Pending Confirmation
              </button>
            </div>
          </Tooltip>
        )}
        {card.status === 'FAILURE' && (
          <Tooltip
            title="Could not get claim code. Please contact BitPay Support."
            placement="top"
            classes={{ tooltip: classes.tooltipStyles }}
            arrow
          >
            <div className="action-button__footer">
              <button
                className="action-button action-button--danger"
                type="button"
                onClick={(): void => handleMenuClick('Help')}
              >
                Something Went Wrong
              </button>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default Card;
