/** Renders a printable power of attorney with order, product, and signature details. */
import '../utils/PowerOfAttorney.css'

// Returns the piece-based quantity, falling back to weight.
function getQuantity(item) {
    return item.piece_based_quantity ?? item.weight_quantity ?? ''
}

// Reads the display name of a product's unit of measure.
function getUnit(item) {
    return item.product?.product_unit?.unit?.display_name ?? ''
}

// Extracts an organization name from a string or object.
function getName(value) {
    if (!value) return ''
    if (typeof value === 'string') return value
    return value.organization || value.name || ''
}

// Formats an ISO date as DD.MM.YYYY with an optional UTC day offset.
function formatDate(date, addDays = 0) {
    if (!date) return ''

    // ISO date from the order API. Use UTC arithmetic so the result does not
    // shift when users in different time zones generate the same document.
    const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return ''

    const [, year, month, day] = match
    const value = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    value.setUTCDate(value.getUTCDate() + addDays)

    return `${String(value.getUTCDate()).padStart(2, '0')}.${String(value.getUTCMonth() + 1).padStart(2, '0')}.${value.getUTCFullYear()}`
}

// Builds the printable authorization form for an order and its products.
export default function PowerOfAttorney({ order }) {
    const products = order.order_products ?? []

    return (
        <>
            <div className="poa-page">
                <div className="poa-cut">
                    <div>Доверенность № {order.id}</div>
                    <div>Дата: {order.delivery_date}</div>
                    <div>Поставщик: {getName(order.supplier)}</div>
                    <div>Покупатель: ООО "Авангард"</div>
                </div>

                <h2>ДОВЕРЕННОСТЬ № {order.id}</h2>

                <div className="poa-row">
                    <div>
                        <span>Дата выдачи:</span>
                        <b>{formatDate(order.delivery_date)}</b>
                    </div>
                    <div>
                        <span>Действительна до:</span>
                        <b>{formatDate(order.delivery_date, 3)}</b>
                    </div>
                </div>

                <div className="poa-line">
                    <b>Организация:</b> ООО "Авангард"
                </div>

                <div className="poa-line">
                    <b>Плательщик:</b> ООО "Авангард"
                </div>

                <div className="poa-line">
                    <b>Адрес:</b> 194021, г. Санкт-Петербург, пр. 2-й Муринский, д.38, литер «А», пом. 305
                </div>

                <div className="poa-line">
                    <b>Доверенность выдана:</b> {order.driver ?? ''}
                </div>

                <div className="poa-line">
                    <b>Паспорт:</b> {order.passport ?? ''}
                </div>

                <div className="poa-line">
                    <b>На получение от:</b> {getName(order.supplier)}
                </div>

                <table className="poa-products">
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Наименование материальных ценностей</th>
                            <th>Ед. изм.</th>
                            <th>Количество</th>
                        </tr>
                    </thead>

                    <tbody>
                        {products.map(/* Renders a numbered product row with its unit and quantity. */ (item, index) => (
                            <tr key={item.id}>
                                <td>{index + 1}</td>
                                <td>{item.product?.name}</td>
                                <td>{getUnit(item)}</td>
                                <td>{getQuantity(item)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="poa-signature-block">
                    <div className="poa-signature-row">
                        <span>Подпись лица, получившего доверенность:</span>
                        <div className="poa-signature-line-wrap">
                            <div className="poa-signature-line"></div>
                        </div>
                    </div>
                </div>

                <div className="poa-signature-block poa-manager-block">
                    <div className="poa-signature-row">
                        <div className="poa-signature-line-wrap">
                            <span>Руководитель</span>
                            <div className="poa-signature-line"></div>
                            <div className="poa-signature-name">(Рыбкин В.Л.)</div>
                        </div>
                    </div>

                    <div className="poa-stamp">
                        <img src="/images/facsimile.png" alt="" />
                    </div>
                </div>

                <div className="poa-signature-block">
                    <div className="poa-signature-row">
                        <div className="poa-signature-line-wrap">
                            <span>Главный бухгалтер</span>
                            <div className="poa-signature-line"></div>
                            <div className="poa-signature-name">(Данилова Н.Ю.)</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
